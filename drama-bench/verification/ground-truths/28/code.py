df_no_total = df[df["State/Union Territory"] != "U.S. Total"]
total_registered = df_no_total["Total Active Registered Voters"].dropna().sum()
total_registered_millions = total_registered / 1e6