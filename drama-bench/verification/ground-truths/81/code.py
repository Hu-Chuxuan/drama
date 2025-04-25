min_score = df["Estimated Score"].min()

countries_with_min_score = df[df["Estimated Score"] == min_score]["Country"].tolist()

usa_last = "United States" in countries_with_min_score