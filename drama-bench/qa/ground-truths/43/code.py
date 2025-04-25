# Count the number of states where recreational marijuana is fully legal
num_legal_states = (df["Status"] == "Fully legal").sum()
