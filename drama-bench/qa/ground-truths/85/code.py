total_complaints = df["Number of complaints"].sum()

relevant = df[df["Alleged discrimination"].isin(["Disability", "Sex", "Race and national origin"])]
relevant_total = relevant["Number of complaints"].sum()

percentage = (relevant_total / total_complaints) * 100