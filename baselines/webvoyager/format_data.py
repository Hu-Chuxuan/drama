import json
import argparse
import os

def convert_to_jsonl(input_path, output_path):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    try:
        with open(input_path, "r", encoding="utf-8") as infile, open(output_path, "w", encoding="utf-8") as outfile:
            data = json.load(infile)
            if not isinstance(data, list):
                raise ValueError("Input JSON file must contain a list of objects.")
            
            for item in data:
                # Rename 'question' or 'claim' to 'ques' if they exist
                if 'question' in item or 'claim' in item:
                    item['ques'] = item.pop('question', None) or item.pop('claim', None)
                outfile.write(json.dumps(item) + "\n")

        print(f"Converted {input_path} to JSONL and saved as: {output_path}")
    except json.JSONDecodeError:
        print(f"Error: {input_path} is not a valid JSON file.")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Convert a JSON file to JSONL format.")
    parser.add_argument("input_file", help="Path to the input JSON file")
    parser.add_argument("output_file", help="Path to the output JSONL file")
    args = parser.parse_args()
    convert_to_jsonl(args.input_file, args.output_file)