# # Raph
# def somme_entiers(n):
#     somme = 0
#     for i in range (n+1):
#         somme += i
#     return somme

# # print(f"raph -> {somme_entiers(4)}") # Doit retourner 10

# # Lucas
# def somme_entiers(n:int) -> int :
#     if n == 0:
#         return 0
#     else:
#         res:int = 0
#         for i in range(n):
#             print(f"i = {i}")
#             print(f"n = {n}")
#             print(f"res = {res}")
#             res += n-i
#         return res
        
# # print(f"lucas -> {somme_entiers(4)}") # Doit retourner 10

# def occurence_lettre(une_chaine, une_lettre):
#     """
#     _summary_

#     Args:
#         une_chaine (_type_): _description_
#         une_lettre (_type_): _description_

#     Returns:
#         _type_: _description_
#     """
#     occurences = 0
#     for i in range(len(une_chaine)):
#         if une_chaine[i] == une_lettre:
#             occurences += 1
#     return occurences

# chaine = "plop"
# lettre = "p"

# print(f"il y a {occurence_lettre(chaine, lettre)} fois la lettre -> {lettre}")

## Raphael ##
def est_palindrome(chaine):
    while len(chaine)>=2:
        if chaine[0] != chaine[-1]
            return False
        chaine = chaine[1:-1]
    return True

est_palindrome("kayak")