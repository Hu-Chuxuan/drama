trans_people = df[df["Gender"] == "Trans people"]
trans_trouble_percentage = trans_people["Very (%)"].values[0] + trans_people["Somewhat (%)"].values[0]