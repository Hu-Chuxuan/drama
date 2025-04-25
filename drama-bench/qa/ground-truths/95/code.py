df["Total Shootings"] = df["Shootings with injuries only"] + df["Shootings with deaths"]
total_shootings = df["Total Shootings"].sum()