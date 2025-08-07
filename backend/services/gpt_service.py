import openai

def classify_message_as_log(message: str) -> bool:
    """
    Use GPT to determine if the input is a fitness log.
    """
    response = openai.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": "You are a classifier. Return 'yes' if the message is a fitness log (e.g. 'DOMS 2, 71.4kg, good sleep'). Return 'no' if it's a question or something else. Only respond with 'yes' or 'no'."
            },
            {
                "role": "user",
                "content": message.strip()
            }
        ],
        temperature=0
    )

    reply = response.choices[0].message.content.strip().lower()
    # print(reply)
    return reply == "yes"

def is_general_coaching_question(message: str) -> bool:
    """
    Classifies if the message is a general fitness coaching advice not tied to logs.
    """
    response = openai.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": "You're a classifier. Return 'yes' if the message is a general fitness or bodybuilding coaching question (e.g. diet tips, training frequency), not specific to personal logs or metrics. Otherwise return 'no'."
            },
            {
                "role": "user",
                "content": message
            }
        ],
        temperature=0
    )
    # print(response.choices[0].message.content)
    return response.choices[0].message.content.strip().lower() == "yes"


def generate_response(messages: list[dict]) -> str:
    """
    Generate a GPT response given a list of messages.
    Each message must be a dict with keys: role (user|assistant|system) and content.
    """
    response = openai.chat.completions.create(
        model="gpt-4o",
        messages=messages,
        temperature=0.5
    )
    # print(response.choices[0].message.content)
    return response.choices[0].message.content.strip()
