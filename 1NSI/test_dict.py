scores = {}

while True:
    pseudo = input("Quel est ton pseudo ('fin' pour arrêter) : ")
    
    if pseudo == "fin":
        break
    elif pseudo in scores:
        score = input("Quel est ton score :")
        scores[pseudo] += ", " + score
    else:
        score = input("Quel est ton score :")
        scores[pseudo] = score

for elem1, elem2 in scores.items():
    print(f"le score de {elem1} est de {elem2}")
