"""
Train Fake News Detection Model without dataset leakage.
Uses TF-IDF Vectorization and Logistic Regression.
"""
from pathlib import Path
import re
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
MODEL_DIR = BASE_DIR / "model"
MODEL_DIR.mkdir(exist_ok=True)


def clean_news_text(text: str) -> str:
    """
    Remove publisher datelines (e.g. 'WASHINGTON (Reuters) -', '(Reuters)')
    to prevent target leakage where the model only memorizes the wire-service name.
    """
    if not isinstance(text, str):
        return ""
    # Strip Reuters and news agency datelines: e.g. 'WASHINGTON (Reuters) -', '(Reuters) -'
    cleaned = re.sub(r'^[A-Z\s,./\'-]{2,35}\((?:Reuters|AP|AFP)\)\s*[-—:]?\s*', '', text, flags=re.IGNORECASE)
    cleaned = re.sub(r'^\((?:Reuters|AP|AFP)\)\s*[-—:]?\s*', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\bReuters\b', '', cleaned, flags=re.IGNORECASE)
    # Normalize excess whitespace
    cleaned = re.sub(r'\s+', ' ', cleaned)
    return cleaned.strip()


def read_dataset(path: Path, label: str) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(
            f"Missing {path.name}. Place Fake.csv and True.csv inside data/."
        )
    
    # Try Latin-1 then utf-8
    try:
        df = pd.read_csv(path, encoding="latin-1")
    except Exception:
        df = pd.read_csv(path, encoding="utf-8", errors="replace")

    columns = {c.lower(): c for c in df.columns}
    text_col = columns.get("text")
    title_col = columns.get("title")
    if text_col is None:
        raise ValueError(f"Could not find a 'text' column in {path.name}. Found columns: {list(df.columns)}")

    body = df[text_col].fillna("").astype(str)
    if title_col:
        title = df[title_col].fillna("").astype(str)
        combined = (title + " " + body).str.strip()
    else:
        combined = body.str.strip()

    # Clean text to prevent agency name leakage
    cleaned_text = combined.map(clean_news_text)

    result = pd.DataFrame({"text": cleaned_text, "label": label})
    result = result[result["text"].str.len() >= 30]
    return result


def main():
    print("Loading CSV files...")
    fake = read_dataset(DATA_DIR / "Fake.csv", "FAKE")
    real = read_dataset(DATA_DIR / "True.csv", "REAL")

    print(f"Loaded {len(fake):,} fake articles and {len(real):,} real articles.")
    data = pd.concat([fake, real], ignore_index=True)
    data = data.drop_duplicates(subset=["text"]).sample(frac=1, random_state=42).reset_index(drop=True)

    print(f"Total unique articles for training/testing: {len(data):,}")
    if len(data) < 20 or data["label"].nunique() < 2:
        raise ValueError("Not enough valid labeled examples to train.")

    X_train, X_test, y_train, y_test = train_test_split(
        data["text"], data["label"], test_size=0.15, random_state=42, stratify=data["label"]
    )

    model = Pipeline([
        ("tfidf", TfidfVectorizer(
            stop_words="english",
            max_df=0.90,
            min_df=2,
            ngram_range=(1, 2),
            max_features=120000,
            sublinear_tf=True
        )),
        ("classifier", LogisticRegression(max_iter=1000, class_weight="balanced", C=2.0, random_state=42))
    ])

    print(f"Training on {len(X_train):,} articles; testing on {len(X_test):,} articles...")
    model.fit(X_train, y_train)

    predicted = model.predict(X_test)
    print("\n=== Held-out test metrics (Leakage Free) ===")
    print(f"Accuracy: {accuracy_score(y_test, predicted):.4f}")
    print(classification_report(y_test, predicted, zero_division=0))
    print("Confusion matrix:")
    print(confusion_matrix(y_test, predicted))

    output = MODEL_DIR / "news_model.joblib"
    joblib.dump(model, output)
    print(f"\nSaved model: {output}")

    # Quick sanity check on real modern news & fake news
    print("\n=== Sanity Checks on New Unseen Texts ===")
    sanity_samples = [
        ("Real News (Fed Economy)", "Federal Reserve officials signaled they expect to cut interest rates two more times this year as inflation continues to cool toward their 2 percent target, according to official projections released on Wednesday."),
        ("Real News (Science)", "NASA researchers confirmed that the James Webb Space Telescope observed an ancient cluster of galaxies formed shortly after the Big Bang, providing fresh insight into the early expansion of the cosmos."),
        ("Fake News (Conspiracy)", "BREAKING BOMBSHELL: Top secret leaked documents reveal secret government cabal is putting mind control microchips into tap water to force citizen obedience! Mainstream media is covering this up, share before deleted!"),
        ("Fake News (Clickbait)", "You will not believe what Hollywood celebrities were caught doing at this private island party! The shocking video proof that will destroy their careers forever.")
    ]
    for name, sample in sanity_samples:
        pred = model.predict([sample])[0]
        prob = max(model.predict_proba([sample])[0]) * 100
        print(f"[{pred} - {prob:.1f}%] {name}")


if __name__ == "__main__":
    main()
