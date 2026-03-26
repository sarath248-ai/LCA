import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestRegressor
from sklearn.multioutput import MultiOutputRegressor
from sklearn.metrics import r2_score
import joblib

# -----------------------------
# 1. Generate synthetic dataset
# -----------------------------

np.random.seed(42)
n = 500

df = pd.DataFrame({
    "Raw_Material_Type": np.random.choice(["Iron Ore", "Bauxite", "Copper Ore"], n),
    "Material_Type": np.random.choice(["Steel", "Aluminium", "Copper"], n),
    "Energy_Source_Type": np.random.choice(["Electricity", "Coal", "Natural Gas"], n),

    "Raw_Material_Quantity": np.random.uniform(500, 3000, n),
    "Recycled_Material_Quantity": np.random.uniform(0, 800, n),
    "Energy_Consumption_kWh": np.random.uniform(1000, 10000, n),
    "Water_Consumption_Liters": np.random.uniform(500, 8000, n),
    "Production_Volume": np.random.uniform(200, 2500, n),
    "Ore_Grade": np.random.uniform(0.3, 0.9, n),
    "Waste_Slag_Quantity": np.random.uniform(50, 500, n),
    "Scrap_Content_Percentage": np.random.uniform(5, 40, n),
    "Recycling_Rate_Percentage": np.random.uniform(10, 80, n),
})

# --------------------------------
# 2. Generate target emissions
# --------------------------------

df["CO2_Emissions_kg"] = (
    df["Energy_Consumption_kWh"] * 0.8
    - df["Recycling_Rate_Percentage"] * 10
    + df["Waste_Slag_Quantity"] * 2
)

df["SOx_Emissions_kg"] = df["CO2_Emissions_kg"] * 0.02
df["NOx_Emissions_kg"] = df["CO2_Emissions_kg"] * 0.015

# --------------------------------
# 3. Features & targets
# --------------------------------

X = df.drop(
    ["CO2_Emissions_kg", "SOx_Emissions_kg", "NOx_Emissions_kg"],
    axis=1
)
y = df[["CO2_Emissions_kg", "SOx_Emissions_kg", "NOx_Emissions_kg"]]

categorical_cols = [
    "Raw_Material_Type",
    "Material_Type",
    "Energy_Source_Type"
]

numerical_cols = [c for c in X.columns if c not in categorical_cols]

# --------------------------------
# 4. Preprocessing + Model
# --------------------------------

preprocessor = ColumnTransformer(
    transformers=[
        ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_cols),
        ("num", "passthrough", numerical_cols),
    ]
)

model = MultiOutputRegressor(
    RandomForestRegressor(
        n_estimators=200,
        random_state=42,
        n_jobs=-1
    )
)

pipeline = Pipeline(
    steps=[
        ("preprocessor", preprocessor),
        ("model", model)
    ]
)

# --------------------------------
# 5. Train-test split & training
# --------------------------------

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

pipeline.fit(X_train, y_train)

# --------------------------------
# 6. Evaluation
# --------------------------------

preds = pipeline.predict(X_test)
print("R2 score:", r2_score(y_test, preds, multioutput="uniform_average"))

# --------------------------------
# 7. Save model
# --------------------------------

joblib.dump(pipeline, "app/ml/model_emissions.pkl")

print("✅ ML model trained and saved successfully")
