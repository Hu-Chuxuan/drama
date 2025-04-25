import pandas as pd
import numpy as np

df = pd.read_csv("data.csv", delimiter='\t')
print(df.sort_values(by="% Held", ascending=False))