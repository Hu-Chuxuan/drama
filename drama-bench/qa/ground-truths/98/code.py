df["Total"] = df["Injuries"] + df["Other illnesses"] + df["Respiratory illnesses"]

# Get total for 2022
total_2022 = df[df["Year"] == 2022]["Total"].values[0]