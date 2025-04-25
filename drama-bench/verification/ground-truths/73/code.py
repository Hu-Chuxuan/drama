import pandas as pd
df = pd.read_csv("data.csv")
the_most_certifications = df.loc[df["Number of Certifications"] == df["Number of Certifications"].max(), "Artist"].values[0]
cardib = df.loc[df["Artist"] == "Cardi B", "Number of Certifications"].values[0]
nicki_minaj = df.loc[df["Artist"] == "Nicki Minaj", "Number of Certifications"].values[0]

is_cardib_number_one = cardib == the_most_certifications
does_cardib_have_more_certifications_than_nicki = cardib > nicki_minaj

print(is_cardib_number_one)
print(does_cardib_have_more_certifications_than_nicki)