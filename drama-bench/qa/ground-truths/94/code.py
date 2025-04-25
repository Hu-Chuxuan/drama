df["Casualties"] = df["Deaths"] + df["Injuries"]
total_casualties = df["Casualties"].sum()