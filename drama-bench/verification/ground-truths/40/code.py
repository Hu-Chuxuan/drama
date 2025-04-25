import pandas as pd

df = pd.read_csv('data.csv')


winner = df.loc[df['Percentage of Popular Vote'].idxmax()]

if winner['Candidate'] == 'Donald Trump':
    print("Claim is TRUE: Donald Trump won the popular vote.")
else:
    print("Claim is FALSE: Donald Trump did not win the popular vote.")
