import pandas as pd

df = pd.read_csv('data.csv')

initial_salary = 174000 
final_salary = 243000 

actual_salary_after_adjustment = df['Salary After Adjustment'].iloc[0]

actual_increase = actual_salary_after_adjustment - initial_salary

claimed_increase = final_salary - initial_salary

is_claim_valid = actual_increase == claimed_increase

print(f"Initial salary: ${initial_salary}")
print(f"Claimed final salary: ${final_salary}")
print(f"Actual salary after adjustment: ${actual_salary_after_adjustment}")
print(f"Claimed increase: ${claimed_increase}")
print(f"Actual increase: ${actual_increase}")
print(f"Is the claim valid? {is_claim_valid}")
