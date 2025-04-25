total_budget = df["Budget"].sum()

df["Percentage of Total (%)"] = (df["Budget"] / total_budget) * 100

ies_percentage = df[df["Program area"] == "Institute of Education Sciences"]["Percentage of Total (%)"].values[0]