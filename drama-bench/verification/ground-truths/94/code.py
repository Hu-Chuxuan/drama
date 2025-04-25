import pandas as pd
from scipy import stats

df = pd.read_csv('data.csv')
x = df['Year']
y = df['Turbulence-Related']

slope, intercept, r_value, p_value, std_err = stats.linregress(x, y)