## Lou
# def fibonacci(n):
#     if n <= 1 :
#         return n
#     else : 
#         return fibonacci (n - 1 ) + fibonacci(n - 2)

# print(f"fibo de 1 doit retourner 1: {fibonacci(1)}") # doit retourner 1
# print(f"fibo de 2 doit retourner 1: {fibonacci(2)}") # doit retourner 1
# print(f"fibo de 25 doit retourner 75025: {fibonacci(25)}") # doit retourner 75025

# def eleves_du_mois(eleves, notes):
#     note_maxi = 0
#     meilleurs_eleves = [] # Initialisation d'une liste vide

#     for i in range(len(eleves)):
#         if notes[i] == note_maxi:
#             meilleurs_eleves.append(eleves[i]) 
#         elif notes[i] > note_maxi: 
#             note_maxi = notes[i] 
#             meilleurs_eleves = [eleves[i]]

#     return (note_maxi, meilleurs_eleves)

# # eleves_nsi = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']
# # notes_nsi = [30, 40, 80, 60, 58, 80, 75, 80, 60, 24]

# # print(eleves_du_mois(eleves_nsi, notes_nsi))

# print(eleves_du_mois(['a', 'b', 'c', 'd'], [15, 18, 12, 18]))