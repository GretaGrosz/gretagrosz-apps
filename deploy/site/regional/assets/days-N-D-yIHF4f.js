const e={37:{lesson:{idea:"Let d = gcd(a, b). The equation ax + by = c has integer solutions exactly when d divides c. Why: d divides ax + by for all x, y, so d must divide c; and Euclid’s algorithm run backwards writes d = au + bv, so multiplying by c/d gives a solution. Once you have one solution (x₀, y₀), all solutions are x = x₀ + (b/d)·t, y = y₀ − (a/d)·t for integers t: the change in ax cancels the change in by. To count positive solutions, write down this formula and find which t keep both x and y positive. You spot this topic when a problem talks about coins, prices or “how many ways to pay”. The classic trap: stepping by b instead of b/d and so missing solutions.",steps:["Check that gcd(a, b) divides c. If not, there are no solutions.","Find one solution: reduce mod the bigger coefficient (e.g. ax ≡ c mod b) or try small values.","Write all solutions: x = x₀ + (b/d)t, y = y₀ − (a/d)t.","For positive (or nonnegative) solutions, turn x > 0 and y > 0 into bounds on t and count.","Trap: forgetting to divide by d in the step size."],example:{q:"Find all pairs of positive integers (x, y) with 7x + 5y = 100.",a:`Mod 5: 7x ≡ 2x ≡ 0, so 5 | x. Write x = 5t: then 35t + 5y = 100, so y = 20 − 7t. We need t ≥ 1 and 20 − 7t ≥ 1, so t = 1 or 2.

The solutions are (5, 13) and (10, 6).`},de:[["lineare diophantische Gleichung","linear Diophantine equation"],["ganzzahlige Lösung","integer solution"],["Parameterdarstellung","parametrisation"],["größter gemeinsamer Teiler","greatest common divisor"]]},problems:[{type:"answer",q:`How many pairs of positive integers (x, y) satisfy

3x + 5y = 2026?`,answers:["135"],hints:["First find which remainder x must leave mod 5.","Mod 5: 3x ≡ 2026 ≡ 1, so x ≡ 2 (mod 5).","x = 2, 7, 12, … and you need 5y = 2026 − 3x ≥ 5."],solution:`Mod 5: 3x ≡ 1, and 3·2 = 6 ≡ 1, so x ≡ 2 (mod 5). Each such x with 3x ≤ 2021 gives a positive y = (2026 − 3x)/5.

3x ≤ 2021 means x ≤ 673, and the largest x ≡ 2 (mod 5) there is 672 (then y = 2). So x = 2, 7, …, 672: that is (672 − 2)/5 + 1 = 135 values.`},{type:"answer",q:`Cheap tickets cost 11 euros and expensive ones cost 17 euros. Greta spent exactly 500 euros on tickets and bought more cheap tickets than expensive ones.

How many tickets did she buy in total?`,answers:["40"],hints:["Set up 11x + 17y = 500 with x, y ≥ 0.","Work mod 11: 17y ≡ 6y ≡ 500 ≡ 5 (mod 11).","The inverse of 6 mod 11 is 2, so y ≡ 10 (mod 11)."],solution:`11x + 17y = 500. Mod 11: 6y ≡ 5, multiply by 2 (since 6·2 = 12 ≡ 1): y ≡ 10 (mod 11). With 17y ≤ 500 we need y ≤ 29, so y = 10 or 21.

• y = 10: 11x = 330, x = 30.
• y = 21: 11x = 143, x = 13.

Only (30, 10) has more cheap tickets, so she bought 40 tickets.`},{type:"proof",q:"Prove that 59 cannot be written as 7a + 11b with nonnegative integers a, b, but every integer n ≥ 60 can.",hints:["Work mod 7. Which b are possible for a given n?","11b ≡ 4b (mod 7), and as b runs through 0, 1, …, 6 it hits every remainder mod 7.","For 59: 4b ≡ 59 ≡ 3 (mod 7) forces b ≡ 6 (mod 7)."],keySteps:["59: mod 7, 11b ≡ 4b ≡ 3, so b ≡ 6 (mod 7), so b ≥ 6.","Then 11b ≥ 66 > 59, so a would be negative. 59 is impossible.","n ≥ 60: the numbers 11b for b = 0, 1, …, 6 leave all 7 different remainders mod 7, so some b ≤ 6 has 11b ≡ n (mod 7).","Then n − 11b is divisible by 7 and n − 11b ≥ 60 − 66 = −6, so n − 11b ≥ 0 and a = (n − 11b)/7 ≥ 0 works."],solution:`59: if 7a + 11b = 59, then mod 7 we get 4b ≡ 3. Since 4·6 = 24 ≡ 3 and 4 is invertible mod 7, b ≡ 6 (mod 7), so b ≥ 6. But then 11b ≥ 66 > 59, impossible.

n ≥ 60: 11b ≡ 4b (mod 7), and 4·0, 4·1, …, 4·6 are all different mod 7 (4 is coprime to 7). So there is b ∈ {0, …, 6} with 11b ≡ n (mod 7). Then n − 11b is a multiple of 7 and n − 11b ≥ 60 − 66 = −6. A multiple of 7 that is at least −6 is at least 0, so a = (n − 11b)/7 is a nonnegative integer with 7a + 11b = n.`}],challenge:{source:"Classic",q:`A rooster costs 5 coins, a hen costs 3 coins, and 3 chicks cost 1 coin. With exactly 100 coins someone buys exactly 100 birds, at least one of each kind.

Find all possibilities (x roosters, y hens, z chicks) and prove there are no others.`,keySteps:["Equations: x + y + z = 100 and 5x + 3y + z/3 = 100.","Multiply the second by 3 and subtract the first: 14x + 8y = 200, i.e. 7x + 4y = 100.","Mod 4: 7x ≡ 3x ≡ 0, so 4 | x. With x = 4t: y = 25 − 7t, z = 75 + 3t (z is automatically a multiple of 3).","x ≥ 1 and y ≥ 1 give t = 1, 2, 3.","Answer (4, 18, 78), (8, 11, 81), (12, 4, 84), each checked in both equations."],solution:`We need x + y + z = 100 and 15x + 9y + z = 300 (the cost equation times 3). Subtracting gives 14x + 8y = 200, i.e. 7x + 4y = 100.

Mod 4: 7x ≡ 3x ≡ 0, and 3 is invertible mod 4, so x = 4t. Then y = (100 − 28t)/4 = 25 − 7t and z = 100 − x − y = 75 + 3t. Note z is a multiple of 3, so the chicks can really be bought in threes.

x ≥ 1 needs t ≥ 1; y ≥ 1 needs 7t ≤ 24, i.e. t ≤ 3. So t = 1, 2, 3:

(x, y, z) = (4, 18, 78), (8, 11, 81), (12, 4, 84).

Check the first: 20 + 54 + 26 = 100 coins and 100 birds. The others work the same way. These are all solutions.`}},41:{lesson:{idea:"An equation x² − y² = a becomes (x − y)(x + y) = a. Now a hard equation is a list of factor pairs: write a = d·e, set x − y = d and x + y = e, and solve x = (d + e)/2, y = (e − d)/2. Two things decide which pairs work. Parity: d and e must have the same parity, because their sum 2x is even. And sign/order: for positive x, y you need 0 < d < e. Consequence: a number is a difference of two squares exactly when it is odd or a multiple of 4 — never when it is 2 mod 4. The same move works whenever you can complete a square: x² + bx + c = y² becomes (2x + b)² − (2y)² = b² − 4c. Classic trap: forgetting negative factor pairs when x, y may be any integers.",steps:["Bring it to the form (something)² − (something)² = constant, completing the square if needed.","Factor: (x − y)(x + y) = a.","List all factor pairs d·e = a. Keep only pairs with d, e of the same parity.","Solve x = (d + e)/2, y = (e − d)/2 and check.","If negative x, y are allowed, also use negative pairs (d, e both < 0)."],example:{q:"Find all pairs of positive integers (x, y) with x² − y² = 45.",a:`(x − y)(x + y) = 45 with 0 < x − y < x + y. The pairs are 1·45, 3·15, 5·9 (all odd, so the parity is fine).

1, 45 → (23, 22). 3, 15 → (9, 6). 5, 9 → (7, 2).`},de:[["Differenz zweier Quadrate","difference of two squares"],["Faktorzerlegung","factorisation"],["Teilerpaar","factor pair"],["gleiche Parität","same parity"]]},problems:[{type:"answer",q:`How many pairs of positive integers (x, y) satisfy

x² − y² = 2025?`,answers:["7"],hints:["Factor the left side.","(x − y)(x + y) = 2025 with 0 < x − y < x + y.","2025 = 3⁴·5² has 15 divisors, and 45·45 is the middle one."],solution:"(x − y)(x + y) = 2025. All divisors of 2025 are odd, so parity is never a problem. 2025 = 3⁴·5² has 5·3 = 15 divisors; pairing d with 2025/d, the pair 45·45 would give y = 0, and the other 14 divisors form 7 pairs with d < e. So there are 7 solutions."},{type:"answer",q:"How many of the numbers 1, 2, 3, …, 100 can be written as x² − y² with integers x, y?",answers:["75"],hints:["Which remainders can x² − y² leave mod 4?","Squares are 0 or 1 mod 4, so x² − y² is 0, 1 or 3 mod 4.","Odd numbers and multiples of 4 do work: 2k + 1 = (k + 1)² − k² and 4k = (k + 1)² − (k − 1)²."],solution:"Squares are 0 or 1 mod 4, so x² − y² is never 2 mod 4. Every other number works: 2k + 1 = (k + 1)² − k² and 4k = (k + 1)² − (k − 1)². From 1 to 100, exactly 25 numbers are 2 mod 4 (2, 6, …, 98), so 100 − 25 = 75 numbers work."},{type:"proof",q:"Prove that an integer n can be written as x² − y² with integers x, y if and only if n is not of the form 4k + 2.",hints:["One direction is a remainder argument, the other an explicit construction.","Squares are 0 or 1 mod 4.","For odd n = 2k + 1, compare (k + 1)² and k²."],keySteps:["Squares are 0 or 1 mod 4 (even² = 4m², odd² = 4m(m + 1) + 1).","So x² − y² mod 4 is 0, 1 or −1 ≡ 3, never 2.","n odd, n = 2k + 1: n = (k + 1)² − k².","n = 4k: n = (k + 1)² − (k − 1)²."],solution:`If x is even, x² = 4m²; if x is odd, x = 2m + 1 and x² = 4m² + 4m + 1. So every square is 0 or 1 mod 4, and x² − y² is 0 − 0, 1 − 1, 1 − 0 or 0 − 1, i.e. 0, 1 or 3 mod 4. Hence n ≡ 2 (mod 4) is impossible.

Conversely, every other n works (k any integer):
• n = 2k + 1: (k + 1)² − k² = 2k + 1.
• n = 4k: (k + 1)² − (k − 1)² = 4k.
These cover all n with n ≢ 2 (mod 4).`}],challenge:{source:"Olympiad-style",q:`Find all pairs of integers (x, y) with

y² = x² + x + 11.`,keySteps:["Multiply by 4 and complete the square: 4y² = (2x + 1)² + 43.","Factor: (2y − 2x − 1)(2y + 2x + 1) = 43, a prime.","The factor pairs are (1, 43), (43, 1), (−1, −43), (−43, −1). Adding the two factors gives 4y = ±44, so y = ±11.","Subtracting gives 2(2x + 1) = ±42, so 2x + 1 = ±21, x = 10 or −11.","All four combinations work: (10, 11), (10, −11), (−11, 11), (−11, −11); check 10² + 10 + 11 = 121."],solution:`Multiply by 4: 4y² = 4x² + 4x + 44 = (2x + 1)² + 43. So

(2y)² − (2x + 1)² = 43, i.e. (2y − 2x − 1)(2y + 2x + 1) = 43.

Let d = 2y − 2x − 1 and e = 2y + 2x + 1, so de = 43. As 43 is prime, (d, e) is (1, 43), (43, 1), (−1, −43) or (−43, −1).

Then d + e = 4y = ±44, so y = ±11, and e − d = 2(2x + 1) = ±42, so 2x + 1 = ±21, i.e. x = 10 or x = −11. Each of the four pairs (d, e) gives one of the four combinations:

(x, y) = (10, 11), (10, −11), (−11, 11), (−11, −11).

Check: 10² + 10 + 11 = 121 = 11² and (−11)² − 11 + 11 = 121. These are all solutions.`}},45:{lesson:{idea:"There is no perfect square strictly between two consecutive squares a² and (a + 1)². So if you can show a² < N < (a + 1)², then N is not a square. To use this, guess the square that N is close to: for N = n² + 5n + 3 the natural guesses are (n + 2)² and (n + 3)². Compare N with them; usually N lies strictly between them for all large n, and the few small n where the inequality fails are checked by hand. For quartics like n⁴ + … compare with (n² + an + b)², and multiply by 4 first if you get fractions. The same works for cubes between consecutive cubes. Classic trap: the inequality only holds for large n — never forget to check the small cases, because that is where the solutions hide.",steps:["Guess a polynomial P(n) with N ≈ P(n)² (match the leading terms).","Show P(n)² < N, often for all n.","Show N < (P(n) + 1)² and find for which n this holds.","Then N is not a square for those n. Check the remaining small n (and equality cases) by hand.","Fractions in P? Multiply N by 4 (or 16) first."],example:{q:"For which nonnegative integers n is n² + n + 1 a perfect square?",a:"For n ≥ 1: n² < n² + n + 1 < n² + 2n + 1 = (n + 1)², so it lies strictly between two consecutive squares. Only n = 0 works (it gives 1)."},de:[["Quadratzahl","perfect square"],["zwischen zwei aufeinanderfolgenden Quadraten","between two consecutive squares"],["Abschätzung","estimate"],["echt kleiner","strictly smaller"]]},problems:[{type:"answer",q:`There is exactly one positive integer n for which

n² + 6n + 20

is a perfect square. Find it.`,answers:["2"],hints:["Which square is n² + 6n + 20 close to?","n² + 6n + 20 = (n + 3)² + 11.","Compare with (n + 4)² = (n + 3)² + 2n + 7."],solution:`n² + 6n + 20 = (n + 3)² + 11 > (n + 3)². And it is less than (n + 4)² = (n + 3)² + 2n + 7 when 11 < 2n + 7, i.e. n > 2. So for n ≥ 3 it is not a square.

n = 1 gives 27, n = 2 gives 36 = 6². So n = 2.`},{type:"answer",q:`Find the positive integer n for which

n³ + 4n² + 1

is a perfect cube.`,answers:["3"],hints:["Squeeze between consecutive cubes.","Compare with (n + 1)³ = n³ + 3n² + 3n + 1 and (n + 2)³ = n³ + 6n² + 12n + 8.","n³ + 4n² + 1 > (n + 1)³ exactly when n² > 3n."],solution:`(n + 2)³ = n³ + 6n² + 12n + 8 is always bigger. And n³ + 4n² + 1 − (n + 1)³ = n² − 3n = n(n − 3), which is positive for n > 3. So for n > 3 the number lies strictly between (n + 1)³ and (n + 2)³.

n = 1: 6, n = 2: 25, n = 3: 64 = 4³. So n = 3.`},{type:"proof",q:"Prove that the product of four consecutive positive integers is never a perfect square.",hints:["Pair the outer two and the inner two factors.","n(n + 3) = n² + 3n and (n + 1)(n + 2) = n² + 3n + 2.","With m = n² + 3n the product is m(m + 2) = m² + 2m."],keySteps:["Write the product as n(n + 3)·(n + 1)(n + 2) = m(m + 2) with m = n² + 3n ≥ 4.","m(m + 2) = m² + 2m > m².","m² + 2m < m² + 2m + 1 = (m + 1)².","A number strictly between consecutive squares m² and (m + 1)² is not a square."],solution:`Let the numbers be n, n + 1, n + 2, n + 3 with n ≥ 1. Then

n(n + 3)·(n + 1)(n + 2) = (n² + 3n)(n² + 3n + 2) = m(m + 2), where m = n² + 3n ≥ 4.

Now m² < m² + 2m < m² + 2m + 1 = (m + 1)². So the product lies strictly between two consecutive squares and cannot be a square.`}],challenge:{source:"Classic",q:`Find all positive integers n such that

n⁴ + n³ + n² + n + 1

is a perfect square.`,keySteps:["Let N = n⁴ + n³ + n² + n + 1 and look at 4N = 4n⁴ + 4n³ + 4n² + 4n + 4 (N is a square iff 4N is).","(2n² + n)² = 4n⁴ + 4n³ + n², and 4N − (2n² + n)² = 3n² + 4n + 4 > 0.","(2n² + n + 1)² = 4n⁴ + 4n³ + 5n² + 2n + 1, and (2n² + n + 1)² − 4N = n² − 2n − 3 = (n − 3)(n + 1).","For n > 3: (2n² + n)² < 4N < (2n² + n + 1)², so 4N is not a square.","Check n = 1, 2, 3: N = 5, 31, 121 = 11². The only solution is n = 3."],solution:`Let N = n⁴ + n³ + n² + n + 1. N is a square exactly when 4N = (2k)² is, so we squeeze 4N.

Lower: (2n² + n)² = 4n⁴ + 4n³ + n², and 4N − (2n² + n)² = 3n² + 4n + 4 > 0.

Upper: (2n² + n + 1)² = 4n⁴ + 4n³ + 5n² + 2n + 1, and (2n² + n + 1)² − 4N = n² − 2n − 3 = (n − 3)(n + 1).

For n > 3 this is positive, so 4N lies strictly between the consecutive squares (2n² + n)² and (2n² + n + 1)² and is not a square; so N is not a square.

Remaining: n = 1 gives 5, n = 2 gives 31, n = 3 gives 81 + 27 + 9 + 3 + 1 = 121 = 11². So n = 3 is the only solution.`}},49:{lesson:{idea:"A quadratic residue mod m is a remainder that a square can leave: d is one if x² ≡ d (mod m) for some x. The equation x² = ky + d has an integer solution exactly when d is a quadratic residue mod k (then pick x and set y = (x² − d)/k). So to kill such an equation, list the squares mod k — you only need x = 0, 1, …, ⌊k/2⌋, since (−x)² = x². For a prime p there are exactly (p − 1)/2 nonzero residues, because x and −x give the same square. When an equation has a high power, choose a modulus where that power takes few values: by Fermat, y⁵ mod 11 is only 0, 1 or −1. Classic trap: a modulus that “almost” works proves nothing — every residue on one side must be impossible on the other.",steps:["Rewrite as x² ≡ d (mod k).","List the squares mod k (check x up to k/2).","If d is not on the list: no solutions. If it is: solutions exist.","For xⁿ terms, choose a prime p with n | p − 1: then xⁿ takes only a few values mod p.","Trap: also include 0 in your list of squares."],example:{q:"Does x² = 7y + 3 have integer solutions?",a:"Squares mod 7: 0² = 0, 1² = 1, 2² = 4, 3² = 9 ≡ 2. So squares are 0, 1, 2, 4 mod 7. 3 is not among them, so there are no solutions."},de:[["quadratischer Rest","quadratic residue"],["quadratischer Nichtrest","quadratic non-residue"],["Restklasse","residue class"],["unlösbar","has no solution"]]},problems:[{type:"answer",q:`For how many d in {0, 1, 2, …, 12} does the equation

x² = 13y + d

have an integer solution (x, y)?`,answers:["7"],hints:["The equation is solvable exactly when d is a square mod 13.","Compute x² mod 13 for x = 0, 1, …, 6.","They give 0, 1, 4, 9, 3, 12, 10."],solution:"x² = 13y + d is solvable iff x² ≡ d (mod 13) for some x. The squares mod 13 (x = 0 to 6, the rest repeat) are 0, 1, 4, 9, 16 ≡ 3, 25 ≡ 12, 36 ≡ 10. These are 7 different values, so 7 values of d work."},{type:"answer",q:`How many integers x with 0 ≤ x ≤ 99 satisfy

x² ≡ 1 (mod 100)?`,answers:["4"],hints:["100 = 4·25. Solve mod 4 and mod 25 separately.","Mod 25: 25 | (x − 1)(x + 1), and 5 can’t divide both factors (they differ by 2).","So x ≡ ±1 (mod 25), and x must be odd."],solution:`x² ≡ 1 (mod 100) means 4 | x² − 1 and 25 | (x − 1)(x + 1).

Mod 25: x − 1 and x + 1 differ by 2, so 5 divides at most one of them; hence 25 | x − 1 or 25 | x + 1, i.e. x ≡ 1 or 24 (mod 25). Mod 4: x² ≡ 1 iff x is odd.

Candidates 1, 26, 51, 76, 24, 49, 74, 99; the odd ones are 1, 49, 51, 99. So 4 solutions.`},{type:"proof",q:"Prove that n² + 3n + 5 is not divisible by 121 for any integer n.",hints:["Complete the square (multiply by 4 first).","4(n² + 3n + 5) = (2n + 3)² + 11.","If 121 divides it, then 11 | (2n + 3)². What follows?"],keySteps:["4(n² + 3n + 5) = (2n + 3)² + 11.","If 121 | n² + 3n + 5, then 121 | (2n + 3)² + 11, so 11 | (2n + 3)².","11 is prime, so 11 | 2n + 3 and then 121 | (2n + 3)².","So 121 | 11, a contradiction."],solution:`Multiply by 4: 4(n² + 3n + 5) = 4n² + 12n + 20 = (2n + 3)² + 11.

Suppose 121 | n² + 3n + 5. Then 121 | (2n + 3)² + 11, so in particular 11 | (2n + 3)². Since 11 is prime, 11 | 2n + 3, and so 121 | (2n + 3)². Subtracting, 121 | 11 — impossible. So 121 never divides n² + 3n + 5.`}],challenge:{source:"Classic",q:`Prove that there are no integers x, y with

x² = y⁵ − 4.`,keySteps:["Choose the modulus 11: 11 is prime and 5 | 11 − 1.","By Fermat, if 11 ∤ y then (y⁵)² = y¹⁰ ≡ 1, so y⁵ ≡ ±1. So y⁵ ≡ 0, 1 or 10 (mod 11).","Then y⁵ − 4 ≡ 7, 8 or 6 (mod 11).","Squares mod 11 are 0, 1, 4, 9, 5, 3 (from x = 0, …, 5).","6, 7, 8 are not squares mod 11, so there is no solution."],solution:`We work mod 11. If 11 | y, then y⁵ ≡ 0. Otherwise, by Fermat y¹⁰ ≡ 1, so (y⁵ − 1)(y⁵ + 1) ≡ 0 and, 11 being prime, y⁵ ≡ 1 or −1. So y⁵ ≡ 0, 1 or 10, and

y⁵ − 4 ≡ 7, 8 or 6 (mod 11).

The squares mod 11 are 0² = 0, 1, 4, 9, 16 ≡ 5, 25 ≡ 3 (larger x repeat these). None of 6, 7, 8 is a square mod 11, so x² = y⁵ − 4 has no integer solutions.

Why 11? Fifth powers take few values mod p when 5 divides p − 1; 11 is the smallest such prime.`}},53:{lesson:{idea:"In x² + ky² = a (with k > 0) both terms are nonnegative, so ky² ≤ a and |y| ≤ √(a/k). There are only finitely many y to try, and for each one you test whether a − ky² is a square. That is a complete proof, as long as you go through every case. Two things make it faster: a mod argument that removes most cases (e.g. x² + 3y² = 84 forces 3 | x), and completing the square, which turns x² + bxy + cy² into a sum of squares like (x + y)² + 2y². If the expression is not obviously a sum of squares, view it as a quadratic in x: a real solution needs discriminant ≥ 0, which bounds y. Classic trap: forgetting signs and order — each positive solution (x, y) with x, y ≠ 0 gives four integer solutions (±x, ±y).",steps:["Make every term a square times a positive constant (complete the square if needed).","Bound the variable with the biggest coefficient: ky² ≤ a.","Use a modulus to cut down the cases if there are many.","Check each remaining case, then count signs and orders carefully.","Not a sum of squares? Treat it as a quadratic in x and demand discriminant ≥ 0."],example:{q:"Find all integer solutions of x² + 2y² = 34.",a:`2y² ≤ 34, so |y| ≤ 4. y = 0: 34; y = ±1: 32; y = ±2: 26; y = ±3: 16 = 4²; y = ±4: 2. Only y = ±3 works, with x = ±4.

Solutions: (4, 3), (4, −3), (−4, 3), (−4, −3).`},de:[["endlich viele Lösungen","finitely many solutions"],["Fallunterscheidung","case analysis"],["Diskriminante","discriminant"],["Vorzeichen","sign"]]},problems:[{type:"answer",q:`How many pairs of integers (x, y) satisfy

x² + y² = 325?`,answers:["24"],hints:["First find the solutions with 0 ≤ x ≤ y.","y² ≤ 325, so y ≤ 18. Check which 325 − x² are squares.","325 = 1 + 324 = 36 + 289 = 100 + 225."],solution:`Check x = 0, 1, …, 12 (then x² ≤ 325/2): 325 − x² is a square only for x = 1 (18²), x = 6 (17²), x = 10 (15²). So the solutions with 0 < x < y are (1, 18), (6, 17), (10, 15).

Each gives 8 integer solutions (swap x and y, and choose both signs). None has x = 0 or x = y. So 3·8 = 24.`},{type:"answer",q:`How many pairs of positive integers (x, y) satisfy

x² + 3y² = 84?`,answers:["3"],hints:["Look at the equation mod 3.","x² ≡ 84 ≡ 0 (mod 3), so 3 | x.","x = 3, 6 or 9 (x² < 84)."],solution:`Mod 3: x² ≡ 0, so 3 | x. With x² < 84, x ∈ {3, 6, 9}.

x = 3: 3y² = 75, y = 5. x = 6: 3y² = 48, y = 4. x = 9: 3y² = 3, y = 1.

So there are 3 pairs: (3, 5), (6, 4), (9, 1).`},{type:"proof",q:`Find all pairs of integers (x, y) with

x² + 2xy + 3y² = 9,

and prove there are no others.`,hints:["Complete the square in x.","x² + 2xy + 3y² = (x + y)² + 2y².","So 2y² ≤ 9, i.e. y ∈ {−2, −1, 0, 1, 2}."],keySteps:["Rewrite: (x + y)² + 2y² = 9.","So 2y² ≤ 9 and |y| ≤ 2.","y = 0: (x + y)² = 9, x = ±3. y = ±1: (x + y)² = 7, impossible. y = ±2: (x + y)² = 1.","y = 2: x = −1 or −3. y = −2: x = 1 or 3.","Answer: (3, 0), (−3, 0), (−1, 2), (−3, 2), (1, −2), (3, −2)."],solution:`x² + 2xy + 3y² = (x + y)² + 2y², so the equation is (x + y)² + 2y² = 9. Hence 2y² ≤ 9 and y ∈ {−2, −1, 0, 1, 2}.

• y = 0: x² = 9, x = ±3.
• y = ±1: (x + y)² = 7, not a square.
• y = 2: (x + 2)² = 1, so x = −1 or x = −3.
• y = −2: (x − 2)² = 1, so x = 3 or x = 1.

The solutions are (3, 0), (−3, 0), (−1, 2), (−3, 2), (1, −2), (3, −2), and there are no others.`}],challenge:{source:"Olympiad-style",q:`Find all pairs of integers (x, y) with

x² + xy + y² = 3(x + y).`,keySteps:["View it as a quadratic in x: x² + (y − 3)x + (y² − 3y) = 0.","Discriminant: (y − 3)² − 4(y² − 3y) = −3y² + 6y + 9 = −3(y − 3)(y + 1).","A real x needs discriminant ≥ 0, so −1 ≤ y ≤ 3.","Discriminant for y = −1, 0, 1, 2, 3: 0, 9, 12, 9, 0. It must be a perfect square, so y = 1 is out.","Solve each case: (2, −1), (0, 0), (3, 0), (−1, 2), (2, 2), (0, 3). All six check out."],solution:`As a quadratic in x: x² + (y − 3)x + (y² − 3y) = 0. Its discriminant is

D = (y − 3)² − 4(y² − 3y) = −3y² + 6y + 9 = −3(y − 3)(y + 1).

For a real (let alone integer) x we need D ≥ 0, so −1 ≤ y ≤ 3. For an integer x, D must also be a perfect square.

• y = −1: D = 0, x = −(y − 3)/2 = 2.
• y = 0: D = 9, x = (3 ± 3)/2 = 0 or 3.
• y = 1: D = 12, not a square.
• y = 2: D = 9, x = (1 ± 3)/2 = 2 or −1.
• y = 3: D = 0, x = 0.

The solutions are (2, −1), (0, 0), (3, 0), (2, 2), (−1, 2), (0, 3). (Check one: x = 2, y = 2 gives 4 + 4 + 4 = 12 = 3·4.)`}},57:{lesson:{idea:"ν_p(n) is the exponent of the prime p in n: ν_2(40) = 3 because 40 = 2³·5. It turns multiplication into addition: ν_p(ab) = ν_p(a) + ν_p(b), and a | b exactly when ν_p(a) ≤ ν_p(b) for every prime p. For factorials, Legendre’s formula says ν_p(n!) = ⌊n/p⌋ + ⌊n/p²⌋ + ⌊n/p³⌋ + … Why: ⌊n/p⌋ numbers up to n are multiples of p and each gives one factor p; the multiples of p² give a second factor, counted by ⌊n/p²⌋; and so on. Since 2s are more common than 5s, the number of zeros at the end of n! is ν_5(n!). A useful bound: ν_p(n!) < n/(p − 1). Classic trap: counting only ⌊n/p⌋ and forgetting that 25 contributes two 5s.",steps:["Translate divisibility into exponents: a | b iff ν_p(a) ≤ ν_p(b) for all p.","For n!, add ⌊n/p⌋ + ⌊n/p²⌋ + … until the terms are 0.","Trick: ⌊n/p²⌋ = ⌊⌊n/p⌋/p⌋, so keep dividing the previous result by p.","For a composite like 12ᵏ, do each prime separately and take the minimum.","Trap: trailing zeros need both 2s and 5s, and multiples of 25, 125, … count more than once."],example:{q:"How many zeros does 100! end with?",a:"ν_5(100!) = ⌊100/5⌋ + ⌊100/25⌋ = 20 + 4 = 24. There are more 2s than that, so 100! ends with 24 zeros."},de:[["p-adische Bewertung","p-adic valuation"],["Legendre-Formel","Legendre’s formula"],["Fakultät","factorial"],["Endnullen","trailing zeros"],["Gaußklammer","floor function"]]},problems:[{type:"answer",q:"How many zeros does 2026! end with?",answers:["505"],hints:["Count the factors 5.","Legendre: ⌊2026/5⌋ + ⌊2026/25⌋ + ⌊2026/125⌋ + ⌊2026/625⌋.","405 + 81 + 16 + 3."],solution:"ν_5(2026!) = 405 + 81 + 16 + 3 = 505 (and there are many more factors 2). So 2026! ends with 505 zeros."},{type:"answer",q:"Find the largest integer k such that 12ᵏ divides 100!.",answers:["48"],hints:["12ᵏ = 2²ᵏ·3ᵏ.","Compute ν_2(100!) and ν_3(100!).","ν_2(100!) = 50 + 25 + 12 + 6 + 3 + 1 and ν_3(100!) = 33 + 11 + 3 + 1."],solution:"ν_2(100!) = 50 + 25 + 12 + 6 + 3 + 1 = 97 and ν_3(100!) = 33 + 11 + 3 + 1 = 48. We need 2k ≤ 97 and k ≤ 48, so k = 48."},{type:"proof",q:"Prove that n! is not divisible by 2ⁿ for any positive integer n.",hints:["Use Legendre for p = 2.","Compare ⌊n/2⌋ + ⌊n/4⌋ + … with n/2 + n/4 + … = n.","Why is the inequality strict?"],keySteps:["Legendre: ν_2(n!) = ⌊n/2⌋ + ⌊n/4⌋ + ⌊n/8⌋ + … (a finite sum).","Each term ⌊n/2ᵏ⌋ ≤ n/2ᵏ.","The terms with 2ᵏ > n are 0 but n/2ᵏ > 0, so the inequality is strict: ν_2(n!) < n/2 + n/4 + … = n.","So ν_2(n!) ≤ n − 1 and 2ⁿ ∤ n!."],solution:`By Legendre, ν_2(n!) = Σ ⌊n/2ᵏ⌋ over k ≥ 1. Each term is at most n/2ᵏ, and once 2ᵏ > n the term is 0 while n/2ᵏ > 0. So

ν_2(n!) < n/2 + n/4 + n/8 + … = n.

Hence ν_2(n!) ≤ n − 1, and 2ⁿ does not divide n!.`}],challenge:{source:"Classic",q:"Find all positive integers n such that 2ⁿ⁻¹ divides n!.",keySteps:["Write n in binary: n = 2^(a₁) + 2^(a₂) + … + 2^(a_s) with distinct exponents; s = s₂(n) is the binary digit sum.","Each term 2^a contributes 2^(a−1) + … + 2 + 1 = 2^a − 1 to Σ ⌊n/2ᵏ⌋.","So ν_2(n!) = n − s₂(n).","2ⁿ⁻¹ | n! iff n − s₂(n) ≥ n − 1 iff s₂(n) ≤ 1 iff n is a power of 2.","Answer: n = 1, 2, 4, 8, … (all powers of 2)."],solution:`Claim: ν_2(n!) = n − s₂(n), where s₂(n) is the number of 1s in the binary form of n.

Write n = Σ bᵢ2ⁱ with bᵢ ∈ {0, 1}. Then ⌊n/2ᵏ⌋ = Σ_{i ≥ k} bᵢ2^(i−k) (the lower bits are cut off). Summing over k ≥ 1, a bit bᵢ = 1 contributes 2^(i−1) + 2^(i−2) + … + 1 = 2ⁱ − 1. So

ν_2(n!) = Σ bᵢ(2ⁱ − 1) = n − s₂(n).

Now 2ⁿ⁻¹ | n! iff n − s₂(n) ≥ n − 1 iff s₂(n) ≤ 1. Since n ≥ 1, s₂(n) ≥ 1, so this means s₂(n) = 1: n has a single 1 in binary, i.e. n is a power of 2.

Answer: exactly the powers of two, n = 2ᵏ (k ≥ 0).`}},61:{lesson:{idea:"Write S(n) for the digit sum (Quersumme) of n. Since 10 ≡ 1 (mod 9), every power 10ᵏ ≡ 1, so n = Σ aₖ10ᵏ ≡ Σ aₖ = S(n) (mod 9). The same holds mod 3. And since 10 ≡ −1 (mod 11), n is congruent mod 11 to its alternating digit sum. Two more facts: a number with k digits has S(n) ≤ 9k, which gives strong size bounds; and when you add numbers, every carry lowers the digit sum by 9. Typical uses: find remainders of huge numbers, show a number is not a square (it is 3 mod 9, say), or solve n + S(n) = m by combining a mod 9 condition with the bound n ≥ m − 9k. Classic trap: n ≡ S(n) (mod 9) is a congruence, not an equation — S(n) itself can be much smaller.",steps:["Need n mod 9 or mod 3? Use the digit sum.","Need n mod 11? Use the alternating digit sum from the right.","Bound the digit sum: k digits → S(n) ≤ 9k.","Combine a mod 9 condition with the bound to leave only a few candidates.","Squares are 0, 1, 4, 7 mod 9, so a number ≡ 3 or 6 (mod 9) is never a square."],example:{q:"Find the remainder of 123456789 when divided by 9.",a:"S = 1 + 2 + … + 9 = 45 ≡ 0 (mod 9). So 123456789 is divisible by 9; the remainder is 0."},de:[["Quersumme","digit sum"],["alternierende Quersumme","alternating digit sum"],["Ziffer","digit"],["Dezimaldarstellung","decimal representation"],["Übertrag","carry"]]},problems:[{type:"answer",q:`Let S(n) be the digit sum of n. Find the positive integer n with

n + S(n) = 2026.`,answers:["2021"],hints:["Use mod 9: n + S(n) ≡ 2n.","2n ≡ 2026 ≡ 1 (mod 9), so n ≡ 5 (mod 9).","n < 2026 has at most 4 digits and starts with 1 or 2, so S(n) ≤ 28 and n ≥ 1998."],solution:`Mod 9: 2n ≡ 2026 ≡ 1, so n ≡ 5 (mod 9). Also n < 2026, so S(n) ≤ 1 + 9 + 9 + 9 = 28 and n ≥ 1998. The candidates ≡ 5 (mod 9) in that range are 2003, 2012, 2021:

2003 + 5 = 2008, 2012 + 5 = 2017, 2021 + 5 = 2026. ✓

So n = 2021.`},{type:"answer",q:`Write the numbers 1, 2, 3, …, 2026 one after another to make one huge number:

123456789101112…20252026.

What is its remainder when divided by 9?`,answers:["1"],hints:["Mod 9 a number is congruent to its digit sum.","The digits of each block k add up to S(k) ≡ k (mod 9).","So the huge number ≡ 1 + 2 + … + 2026 (mod 9)."],solution:"The number is ≡ its digit sum, which is S(1) + S(2) + … + S(2026) ≡ 1 + 2 + … + 2026 = 2026·2027/2 = 1013·2027 (mod 9). 1013 ≡ 5 and 2027 ≡ 2, so this is ≡ 10 ≡ 1. The remainder is 1."},{type:"proof",q:`A number is written with exactly 100 zeros, 100 ones and 100 twos, in some order.

Prove that it is not a perfect square.`,hints:["Compute the digit sum.","The digit sum is 300. What does that say mod 3 and mod 9?","If 3 divides a square, what must divide it?"],keySteps:["The digit sum is 100·0 + 100·1 + 100·2 = 300.","So n ≡ 300 ≡ 3 (mod 9): 3 | n but 9 ∤ n.","If n = m² and 3 | n, then 3 | m (3 is prime), so 9 | m² = n.","Contradiction, so n is not a square."],solution:`The digit sum is 0·100 + 1·100 + 2·100 = 300, and 300 = 297 + 3 ≡ 3 (mod 9). Since n ≡ S(n) (mod 9), n ≡ 3 (mod 9): n is divisible by 3 but not by 9.

If n = m², then 3 | m² implies 3 | m (3 is prime), and so 9 | m² = n. That contradicts 9 ∤ n. So n is not a square.`}],challenge:{source:"IMO 1975",q:`Let A be the digit sum of 4444⁴⁴⁴⁴, B the digit sum of A, and C the digit sum of B.

Find C, with proof.`,answers:["7"],keySteps:["Size: 4444⁴⁴⁴⁴ < 10000⁴⁴⁴⁴ = 10^17776, so it has at most 17776 digits and A ≤ 9·17776 = 159984.","A has at most 6 digits and is at most 159984, so B ≤ 1 + 5·9 = 46.","B ≤ 46, so C ≤ 3 + 9 = 12.","Mod 9: 4444 ≡ 7, 7³ = 343 ≡ 1, 4444 = 3·1481 + 1, so 4444⁴⁴⁴⁴ ≡ 7. Hence C ≡ B ≡ A ≡ 7 (mod 9).","The only number from 1 to 12 that is ≡ 7 (mod 9) is 7. So C = 7."],solution:`Size. 4444⁴⁴⁴⁴ < 10000⁴⁴⁴⁴ = 10^17776, so it has at most 17776 digits, and A ≤ 9·17776 = 159984. A number at most 159984 has digit sum at most 1 + 9·5 = 46 (the first digit is 0 or 1), so B ≤ 46. A number at most 46 has digit sum at most 3 + 9 = 12 (e.g. 39), so C ≤ 12.

Mod 9. A digit sum keeps the remainder mod 9, so C ≡ B ≡ A ≡ 4444⁴⁴⁴⁴ (mod 9). Now 4444 ≡ 4 + 4 + 4 + 4 = 16 ≡ 7 and 7³ = 343 ≡ 1 (mod 9). Since 4444 = 3·1481 + 1,

4444⁴⁴⁴⁴ ≡ 7⁴⁴⁴⁴ = (7³)¹⁴⁸¹·7 ≡ 7 (mod 9).

So 1 ≤ C ≤ 12 and C ≡ 7 (mod 9). The only possibility is C = 7.`}},65:{lesson:{idea:"Two related weapons for “find all” problems. Size estimates: if one side grows much faster than the other, only small values can work. For symmetric equations, order the variables (x ≤ y ≤ z) — then the smallest one is bounded, e.g. 1/x + 1/y + 1/z = 1 with x ≤ y ≤ z gives 3/x ≥ 1, so x ≤ 3. Infinite descent: assume there is a solution in positive integers, take one, and build from it a strictly smaller positive solution. Repeating forever gives an infinite decreasing sequence of positive integers, which is impossible. Usually the smaller solution comes from a mod argument: x² + y² = 3z² forces 3 | x and 3 | y, then 3 | z, and (x/3, y/3, z/3) is again a solution. Classic trap: descent only works if the new solution is again of the same kind (integers, positive) and strictly smaller.",steps:["Symmetric? Assume x ≤ y ≤ z, bound the smallest variable, then the next.","Factorials and powers grow fast: from some point on, a mod argument kills all large cases.","Descent: show every solution has all variables divisible by some prime p.","Divide by p to get a smaller solution of the same equation. Conclude only 0 works (or: take a minimal solution and get a contradiction).","Trap: when you assume x ≤ y ≤ z, count the permutations at the end."],example:{q:"Show that x³ + 2y³ = 4z³ has only the integer solution x = y = z = 0.",a:`x³ = 4z³ − 2y³ is even, so x is even: x = 2a. Then 8a³ + 2y³ = 4z³, so y³ = 2z³ − 4a³ and y is even: y = 2b. Then 8a³ + 16b³ = 4z³, so z³ = 2a³ + 4b³ and z = 2c. Dividing by 8: a³ + 2b³ = 4c³ — the same equation.

So x, y, z are divisible by 2, by 4, by 8, …; only 0 is divisible by every power of 2.`},de:[["Größenabschätzung","size estimate"],["unendlicher Abstieg","infinite descent"],["o. B. d. A. (ohne Beschränkung der Allgemeinheit)","without loss of generality"],["minimale Lösung","minimal solution"]]},problems:[{type:"answer",q:`How many ordered triples of positive integers (x, y, z) satisfy

1/x + 1/y + 1/z = 1?`,answers:["10"],hints:["First solve with x ≤ y ≤ z, then count orders.","x ≤ y ≤ z gives 1 ≤ 3/x, so x ≤ 3. And x ≥ 2.","x = 2: 1/y + 1/z = 1/2 with y ≤ z gives y ≤ 4."],solution:`With x ≤ y ≤ z: 1 ≤ 3/x, so x ≤ 3, and x = 1 is impossible.

• x = 2: 1/y + 1/z = 1/2, y ≤ 4: y = 3, z = 6 or y = 4, z = 4.
• x = 3: 1/y + 1/z = 2/3, y ≤ 3: y = z = 3.

Sorted solutions: {2, 3, 6}, {2, 4, 4}, {3, 3, 3}. They give 6 + 3 + 1 = 10 ordered triples.`},{type:"answer",q:`Find the sum of all positive integers x for which

1! + 2! + 3! + … + x!

is a perfect square.`,answers:["4"],hints:["Try small x first.","For k ≥ 5, k! is divisible by 10. Look at the sum mod 5 (or its last digit).","1! + 2! + 3! + 4! = 33."],solution:`x = 1: 1 = 1². x = 2: 3. x = 3: 9 = 3². x = 4: 33.

For x ≥ 4 the sum is 33 plus multiples of 10 (every k! with k ≥ 5 ends in 0), so it ends in 3. No square ends in 3 (squares end in 0, 1, 4, 5, 6, 9). So only x = 1 and x = 3 work, and the sum is 4.`},{type:"proof",q:`Prove that the only integers x, y, z with

x² + y² = 3z²

are x = y = z = 0.`,hints:["Look at the equation mod 3.","Squares are 0 or 1 mod 3, so x² + y² ≡ 0 forces 3 | x and 3 | y.","Then 9 | 3z², so 3 | z. Divide by 3."],keySteps:["Squares are 0 or 1 mod 3; x² + y² ≡ 0 (mod 3) forces x ≡ y ≡ 0.","Write x = 3a, y = 3b: 9(a² + b²) = 3z², so z² = 3(a² + b²) and 3 | z.","With z = 3c: a² + b² = 3c², the same equation with smaller numbers.","Descent: if a nonzero solution existed, take one with |x| + |y| + |z| minimal and positive; (a, b, c) is a smaller one, contradiction."],solution:`Suppose there is a solution other than (0, 0, 0); among all of them pick one with |x| + |y| + |z| as small as possible (it is a positive integer).

Squares are 0 or 1 mod 3, and x² + y² = 3z² ≡ 0 (mod 3). The sum of two numbers from {0, 1} is 0 mod 3 only as 0 + 0, so 3 | x and 3 | y. Write x = 3a, y = 3b. Then 9(a² + b²) = 3z², so z² = 3(a² + b²) is divisible by 3, hence 3 | z; write z = 3c. Dividing by 9: a² + b² = 3c².

So (a, b, c) is again a solution, not all zero, with |a| + |b| + |c| = (|x| + |y| + |z|)/3 smaller. That contradicts minimality. Hence the only solution is x = y = z = 0.`}],challenge:{source:"Classic",q:`Find all integers x, y, z with

x² + y² + z² = 2xyz.`,keySteps:["Prove the stronger statement: if x² + y² + z² = 2ᵏ·xyz with k ≥ 1, then x, y, z are all even.","The right side is even, so the number of odd values among x, y, z is 0 or 2.","If exactly two are odd: the left side ≡ 1 + 1 + 0 ≡ 2 (mod 4), while the right side has an even factor and 2ᵏ, so it is ≡ 0 (mod 4). Contradiction.","So all are even; x = 2a, y = 2b, z = 2c gives a² + b² + c² = 2ᵏ⁺¹·abc, the same type of equation.","Repeating: x, y, z are divisible by every power of 2, so x = y = z = 0. Check: 0 works."],solution:`We prove more: if integers satisfy x² + y² + z² = 2ᵏ·xyz for some k ≥ 1, then x, y, z are all even.

The right side is even, so x² + y² + z² is even, which means an even number of x, y, z are odd: 0 or 2. Suppose exactly two are odd. Odd squares are 1 mod 4 and even squares 0 mod 4, so the left side is ≡ 2 (mod 4). On the right, one of x, y, z is even and k ≥ 1, so 2ᵏ·xyz is divisible by 4. Contradiction. So none is odd.

Now write x = 2a, y = 2b, z = 2c: 4(a² + b² + c²) = 2ᵏ·8abc, i.e. a² + b² + c² = 2ᵏ⁺¹·abc. This is the same type of equation, so a, b, c are even too, and so on.

Starting with k = 1, we get that x, y, z are divisible by 2, 4, 8, … — by every power of 2. Only 0 has this property. So the only solution is x = y = z = 0, and it does work.`}},73:{lesson:{idea:"The engine of Euclid’s algorithm: gcd(a, b) = gcd(a, b − ka) for every integer k, because a common divisor of a and b divides b − ka, and vice versa. So you can subtract multiples freely to shrink one of the numbers — even when they are expressions in n. For gcd(n² + 1, n + 1), subtract (n − 1)(n + 1) to get gcd(n + 1, 2). The same idea with powers: aᵐ − 1 − a^(m−n)·(aⁿ − 1) = a^(m−n) − 1, so you can subtract exponents, and running Euclid on the exponents gives gcd(aᵐ − 1, aⁿ − 1) = a^gcd(m, n) − 1. Classic trap: you may multiply one number by a constant c only if c is coprime to the other number; gcd(a, cb) can be bigger than gcd(a, b).",steps:["Want gcd(f(n), g(n))? Subtract multiples of the smaller expression to lower the degree.","End with a constant: the gcd must divide it.","Multiplying by 2 or 4 to avoid fractions is fine if the other number is odd — say why.","Check which divisors of the constant actually occur by finding an n.","For aᵐ − 1 and aⁿ − 1: run Euclid on the exponents m and n."],example:{q:"Find gcd(n² + 1, n + 1) for a positive integer n.",a:"n² + 1 − (n − 1)(n + 1) = 2, so gcd(n² + 1, n + 1) = gcd(n + 1, 2). It is 2 if n is odd and 1 if n is even."},de:[["größter gemeinsamer Teiler (ggT)","greatest common divisor (gcd)"],["Euklidischer Algorithmus","Euclidean algorithm"],["teilerfremd","coprime"],["Linearkombination","linear combination"]]},problems:[{type:"answer",q:"Find gcd(2¹²⁰ − 1, 2⁸⁴ − 1).",answers:["4095"],hints:["gcd(aᵐ − 1, aⁿ − 1) = a^gcd(m, n) − 1.","gcd(120, 84) = 12.","2¹² = 4096."],solution:"gcd(2¹²⁰ − 1, 2⁸⁴ − 1) = 2^gcd(120, 84) − 1 = 2¹² − 1 = 4095."},{type:"answer",q:`For a positive integer n let dₙ = gcd(n² + 3, (n + 1)² + 3).

What is the largest value dₙ can take?`,answers:["13"],hints:["Subtract: (n + 1)² + 3 − (n² + 3) = 2n + 1.","So dₙ = gcd(n² + 3, 2n + 1). 2n + 1 is odd, so you may multiply n² + 3 by 4.","4(n² + 3) = (2n + 1)(2n − 1) + 13."],solution:`dₙ = gcd(n² + 3, 2n + 1). Since 2n + 1 is odd, multiplying the other number by 4 doesn’t change the gcd: dₙ = gcd(4n² + 12, 2n + 1) = gcd(13, 2n + 1), because 4n² + 12 − (2n − 1)(2n + 1) = 13. So dₙ divides 13.

n = 6: gcd(39, 52) = 13. So the maximum is 13.`},{type:"proof",q:`Let a ≥ 2 and m, n be positive integers. Prove that

gcd(aᵐ − 1, aⁿ − 1) = a^gcd(m, n) − 1.`,hints:["Mimic Euclid’s algorithm on the exponents.","For m > n: aᵐ − 1 − a^(m−n)(aⁿ − 1) = a^(m−n) − 1.","So the pair of exponents (m, n) can be replaced by (m − n, n) without changing the gcd."],keySteps:["For m > n: aᵐ − 1 = a^(m−n)·(aⁿ − 1) + (a^(m−n) − 1).","So gcd(aᵐ − 1, aⁿ − 1) = gcd(a^(m−n) − 1, aⁿ − 1).","Let g(m, n) = gcd(aᵐ − 1, aⁿ − 1). Then g(m, n) = g(m − n, n), and g is symmetric — the same steps as Euclid for gcd(m, n).","Euclid ends at the pair (d, d) with d = gcd(m, n), so the answer is gcd(a^d − 1, a^d − 1) = a^d − 1. (Formally: strong induction on m + n.)"],solution:`For m > n we have a^(m−n)(aⁿ − 1) = aᵐ − a^(m−n), so

aᵐ − 1 = a^(m−n)·(aⁿ − 1) + (a^(m−n) − 1),

and hence gcd(aᵐ − 1, aⁿ − 1) = gcd(a^(m−n) − 1, aⁿ − 1).

Now prove the claim by strong induction on m + n. If m = n, both sides are aⁿ − 1. If m ≠ n, by symmetry m > n; then by the identity and the induction hypothesis for (m − n, n),

gcd(aᵐ − 1, aⁿ − 1) = gcd(a^(m−n) − 1, aⁿ − 1) = a^gcd(m−n, n) − 1 = a^gcd(m, n) − 1,

using gcd(m − n, n) = gcd(m, n).`}],challenge:{source:"Classic",q:`Find all pairs of positive integers (m, n) such that

2ᵐ − 1 divides 2ⁿ + 1.`,keySteps:["m = 1: 2ᵐ − 1 = 1 divides everything, so all (1, n) work.","Reduce the exponent: write n = qm + r with 0 ≤ r < m. Since 2ᵐ ≡ 1 (mod 2ᵐ − 1), 2ⁿ + 1 ≡ 2ʳ + 1.","So 2ᵐ − 1 must divide 2ʳ + 1, where 2 ≤ 2ʳ + 1 ≤ 2^(m−1) + 1.","For m ≥ 3: 2^(m−1) + 1 < 2ᵐ − 1, so a positive number smaller than 2ᵐ − 1 would be divisible by it: impossible.","m = 2: 3 | 2ⁿ + 1 iff n is odd (2ⁿ ≡ (−1)ⁿ mod 3). Answer: (1, n) for all n and (2, n) for odd n."],solution:`If m = 1, then 2ᵐ − 1 = 1 divides 2ⁿ + 1 for every n.

Let m ≥ 2 and write n = qm + r with 0 ≤ r ≤ m − 1. Since 2ᵐ ≡ 1 (mod 2ᵐ − 1),

2ⁿ + 1 = (2ᵐ)^q·2ʳ + 1 ≡ 2ʳ + 1 (mod 2ᵐ − 1).

So we need 2ᵐ − 1 | 2ʳ + 1, where 0 < 2ʳ + 1 ≤ 2^(m−1) + 1.

If m ≥ 3, then 2ᵐ − 1 − (2^(m−1) + 1) = 2^(m−1) − 2 > 0, so 2ʳ + 1 is a positive number smaller than 2ᵐ − 1 and cannot be a multiple of it. No solutions.

If m = 2: 3 | 2ⁿ + 1. As 2 ≡ −1 (mod 3), 2ⁿ + 1 ≡ (−1)ⁿ + 1, which is 0 exactly when n is odd.

Answer: all (1, n), and (2, n) with n odd.`}},77:{lesson:{idea:"Euclid: if p₁, …, pₖ were all the primes, then N = p₁p₂⋯pₖ + 1 leaves remainder 1 when divided by each pᵢ, so any prime factor of N is a new prime. Contradiction. The same trick finds primes of a special shape. Primes ≡ 3 (mod 4): if p₁, …, pₖ were all of them, look at N = 4p₁⋯pₖ − 1 ≡ 3 (mod 4). N is odd, and a product of numbers that are all ≡ 1 (mod 4) is ≡ 1 (mod 4); so N has a prime factor q ≡ 3 (mod 4). q is not any pᵢ (else q | 1). For primes ≡ 1 (mod 4) you need one more fact: an odd prime dividing n² + 1 is always ≡ 1 (mod 4) (this is today’s proof problem). Classic trap: N itself need not be prime — 2·3·5·7·11·13 + 1 = 30031 = 59·509. You only use that N has some prime factor.",steps:["Assume there are only finitely many primes of the kind you want: p₁, …, pₖ.","Build N from their product so that no pᵢ divides N (usually N ≡ ±1 mod each pᵢ).","Show N has a prime factor of the right kind (by remainders mod 4, or by a known fact).","That prime is new: contradiction.","Trap: don’t claim N is prime."],example:{q:"Run the mod 4 argument starting from the primes 3 and 7 (pretend they are all primes ≡ 3 mod 4). Which new prime do you get?",a:"N = 4·3·7 − 1 = 83 ≡ 3 (mod 4). Its prime factors can’t all be ≡ 1 (mod 4), and here N = 83 is itself prime: a new prime ≡ 3 (mod 4), different from 3 and 7."},de:[["unendlich viele Primzahlen","infinitely many primes"],["Widerspruchsbeweis","proof by contradiction"],["Primteiler","prime factor"],["Primzahl der Form 4k + 3","prime of the form 4k + 3"]]},problems:[{type:"answer",q:"How many primes p < 100 satisfy p ≡ 3 (mod 4)?",answers:["13"],hints:["List the primes below 100.","p ≡ 3 (mod 4) means p = 3, 7, 11, 15, … (only the primes).","Start: 3, 7, 11, 19, 23, 31, …"],solution:"They are 3, 7, 11, 19, 23, 31, 43, 47, 59, 67, 71, 79, 83: 13 primes."},{type:"answer",q:"How many primes p < 50 divide at least one number of the form n² + 1 (n a positive integer)?",answers:["7"],hints:["p = 2 works (n = 1).","An odd prime p ≡ 3 (mod 4) never divides n² + 1 (today’s proof problem).","Check that each p ≡ 1 (mod 4) below 50 does: e.g. 5 | 2² + 1, 13 | 5² + 1."],solution:`2 | 1² + 1. Primes ≡ 3 (mod 4) never divide n² + 1. The primes ≡ 1 (mod 4) below 50 all do: 5 | 2² + 1, 13 | 5² + 1, 17 | 4² + 1, 29 | 12² + 1, 37 | 6² + 1, 41 | 9² + 1.

So the primes are 2, 5, 13, 17, 29, 37, 41: 7 of them.`},{type:"proof",q:"Let p be a prime with p ≡ 3 (mod 4). Prove that p does not divide n² + 1 for any integer n.",hints:["Suppose n² ≡ −1 (mod p). Use Fermat.","Raise both sides to the power (p − 1)/2.","(p − 1)/2 is odd when p ≡ 3 (mod 4)."],keySteps:["Suppose p | n² + 1, i.e. n² ≡ −1 (mod p). Then p ∤ n.","Raise to the power (p − 1)/2: nᵖ⁻¹ ≡ (−1)^((p−1)/2).","p = 4k + 3 gives (p − 1)/2 = 2k + 1, odd, so nᵖ⁻¹ ≡ −1.","Fermat says nᵖ⁻¹ ≡ 1. So 1 ≡ −1, i.e. p | 2, impossible for odd p."],solution:`Suppose n² ≡ −1 (mod p). Then p ∤ n (otherwise p | 1). Write p = 4k + 3, so (p − 1)/2 = 2k + 1 is odd. Then

nᵖ⁻¹ = (n²)^(2k+1) ≡ (−1)^(2k+1) = −1 (mod p).

But by Fermat, nᵖ⁻¹ ≡ 1 (mod p). So 1 ≡ −1, i.e. p | 2, which is impossible since p ≥ 3. Hence p never divides n² + 1.`}],challenge:{source:"Classic",q:"Prove that there are infinitely many primes of the form 4k + 1.",keySteps:["Assume p₁, …, pₖ are all the primes ≡ 1 (mod 4) (the list is not empty: 5).","Let N = (2p₁p₂⋯pₖ)² + 1. N > 1 is odd, so it has an odd prime factor q.","q divides a number of the form n² + 1, so q ≢ 3 (mod 4) by the proof problem; hence q ≡ 1 (mod 4).","q is not any pᵢ, since each pᵢ divides N − 1, so it would divide 1.","So q is a new prime ≡ 1 (mod 4): contradiction."],solution:`Suppose there were only finitely many primes ≡ 1 (mod 4), say p₁, …, pₖ (there is at least one, 5). Let

N = (2p₁p₂⋯pₖ)² + 1.

N is odd and greater than 1, so it has a prime factor q, and q is odd. Since q divides n² + 1 with n = 2p₁⋯pₖ, the proof problem shows q is not ≡ 3 (mod 4); being odd, q ≡ 1 (mod 4).

So q is one of the pᵢ. But pᵢ divides N − 1 = (2p₁⋯pₖ)², so it would divide N − (N − 1) = 1. Contradiction. Hence there are infinitely many primes ≡ 1 (mod 4).`}},86:{lesson:{idea:"Equations like 2ˣ + 3ʸ = z² are solved in two moves. First, mod arguments decide parities of exponents: powers are periodic mod m, so pick a modulus where one term is fixed and the other cycles. Mod 3: 2ˣ ≡ (−1)ˣ; mod 4: 3ʸ ≡ (−1)ʸ; mod 8: odd squares are 1. Once an exponent is even, say x = 2a, you get a difference of squares: z² − 2²ᵃ = (z − 2ᵃ)(z + 2ᵃ) = 3ʸ. Second, unique factorisation: if a product is a power of a prime, each factor is a power of that prime. Two powers of 3 (or of 2) that differ by a small number leave almost no choice. Classic trap: forgetting the cases where an exponent is 0 (then the term is 1, not divisible by anything) — do x = 0 and y = 0 separately first.",steps:["Handle exponent 0 (and small values) by hand first.","Find the parity of an exponent with a modulus: mod 3, 4 and 8 are the usual ones.","Even exponent → difference of squares → both factors are prime powers.","Two powers of p whose difference is known: the smaller one is usually 1 (or forced by the p-part of the difference).","Check all solutions in the original equation."],example:{q:"Find all nonnegative integers x and positive integers z with 2ˣ + 1 = z².",a:"(z − 1)(z + 1) = 2ˣ, so both factors are powers of 2 that differ by 2. The only such pair is 2 and 4. So z = 3, x = 3: 8 + 1 = 9. ✓"},de:[["Exponentialgleichung","exponential equation"],["Potenz","power"],["gerade/ungerade","even/odd"],["eindeutige Primfaktorzerlegung","unique prime factorisation"]]},problems:[{type:"answer",q:`How many pairs of positive integers (x, y) satisfy

3ˣ − 2ʸ = 1?`,answers:["2"],hints:["Split into x odd and x even.","x odd: 3ˣ ≡ 3 (mod 8), so 2ʸ = 3ˣ − 1 ≡ 2 (mod 8).","x = 2k: (3ᵏ − 1)(3ᵏ + 1) = 2ʸ, two powers of 2 differing by 2."],solution:`x odd: 3² ≡ 1 (mod 8), so 3ˣ ≡ 3 and 2ʸ ≡ 2 (mod 8), forcing y = 1 and then x = 1.

x = 2k: (3ᵏ − 1)(3ᵏ + 1) = 2ʸ, so both are powers of 2 differing by 2: 2 and 4. So k = 1, x = 2, y = 3.

The solutions are (1, 1) and (2, 3): 2 pairs.`},{type:"answer",q:`Find the positive integer n for which

2⁸ + 2¹¹ + 2ⁿ

is a perfect square.`,answers:["12"],hints:["2⁸ + 2¹¹ is itself a square.","2⁸ + 2¹¹ = 256 + 2048 = 2304 = 48².","2ⁿ = k² − 48² = (k − 48)(k + 48)."],solution:"2⁸ + 2¹¹ = 2304 = 48². So 2ⁿ = (k − 48)(k + 48), and both factors are powers of 2: k − 48 = 2ˢ, k + 48 = 2ᵗ with 2ᵗ − 2ˢ = 96 = 2⁵·3. So 2ˢ(2^(t−s) − 1) = 2⁵·3, giving s = 5 and 2^(t−s) = 4, t = 7. Then n = s + t = 12. Check: 2304 + 4096 = 6400 = 80²."},{type:"proof",q:`Find all pairs of positive integers (x, y) with

2ˣ + 1 = 3ʸ,

and prove there are no others.`,hints:["x = 1 is easy. For x ≥ 2 look mod 4.","x ≥ 2: 3ʸ ≡ 1 (mod 4), and 3ʸ ≡ (−1)ʸ, so y is even.","y = 2k: 2ˣ = (3ᵏ − 1)(3ᵏ + 1)."],keySteps:["x = 1: 3 = 3ʸ, so y = 1.","x ≥ 2: 3ʸ ≡ 1 (mod 4) and 3ʸ ≡ (−1)ʸ, so y = 2k is even.","2ˣ = (3ᵏ − 1)(3ᵏ + 1): both factors are powers of 2 and differ by 2, so they are 2 and 4.","So 3ᵏ = 3, k = 1, y = 2, x = 3. Solutions: (1, 1) and (3, 2)."],solution:`If x = 1, then 3ʸ = 3 and y = 1.

If x ≥ 2, then 3ʸ = 2ˣ + 1 ≡ 1 (mod 4). Since 3 ≡ −1 (mod 4), 3ʸ ≡ (−1)ʸ, so y is even, y = 2k with k ≥ 1. Then

2ˣ = 3²ᵏ − 1 = (3ᵏ − 1)(3ᵏ + 1).

Both factors divide a power of 2, so both are powers of 2, and they differ by 2. The only powers of 2 differing by 2 are 2 and 4. So 3ᵏ = 3, k = 1, y = 2 and 2ˣ = 8, x = 3.

The solutions are (1, 1) and (3, 2).`}],challenge:{source:"Classic",q:`Find all triples of nonnegative integers (x, y, z) with

2ˣ + 3ʸ = z².`,keySteps:["y = 0: 2ˣ = (z − 1)(z + 1), powers of 2 differing by 2: z = 3, x = 3. Solution (3, 0, 3).","x = 0: 3ʸ = (z − 1)(z + 1), powers of 3 differing by 2: 1 and 3, so z = 2, y = 1. Solution (0, 1, 2).","x, y ≥ 1: mod 3, z² ≡ 2ˣ ≡ (−1)ˣ and 3 ∤ z, so z² ≡ 1 and x is even, x = 2a with a ≥ 1.","(z − 2ᵃ)(z + 2ᵃ) = 3ʸ: both are powers of 3 with difference 2ᵃ⁺¹, not divisible by 3, so z − 2ᵃ = 1 and 2ᵃ⁺¹ + 1 = 3ʸ.","By the proof problem (a + 1, y) = (1, 1) or (3, 2); a ≥ 1 gives a = 2, y = 2, x = 4, z = 5. Answer: (3, 0, 3), (0, 1, 2), (4, 2, 5)."],solution:`Case y = 0: 2ˣ = z² − 1 = (z − 1)(z + 1). Both factors are powers of 2 differing by 2, so they are 2 and 4: z = 3, x = 3.

Case x = 0: 3ʸ = (z − 1)(z + 1). Both factors are powers of 3 differing by 2, so they are 1 and 3: z = 2, y = 1.

Case x, y ≥ 1: Mod 3, z² ≡ 2ˣ ≡ (−1)ˣ. Since 3 ∤ 2ˣ, also 3 ∤ z, so z² ≡ 1 and (−1)ˣ = 1: x is even, x = 2a with a ≥ 1. Then

3ʸ = z² − 2²ᵃ = (z − 2ᵃ)(z + 2ᵃ).

Both factors are powers of 3. Their difference 2ᵃ⁺¹ is not divisible by 3, so they can’t both be divisible by 3: z − 2ᵃ = 1 and z + 2ᵃ = 3ʸ. Subtracting, 2ᵃ⁺¹ + 1 = 3ʸ. By the proof problem, (a + 1, y) = (1, 1) or (3, 2). Since a ≥ 1, a = 2, y = 2, so x = 4 and z = 2ᵃ + 1 = 5.

All solutions: (x, y, z) = (3, 0, 3), (0, 1, 2), (4, 2, 5). Check: 8 + 1 = 9, 1 + 3 = 4, 16 + 9 = 25.`}},90:{lesson:{idea:"Sophie Germain’s identity: a⁴ + 4b⁴ = (a² + 2b²)² − (2ab)² = (a² + 2ab + 2b²)(a² − 2ab + 2b²). It comes from completing the square and then using a difference of squares. The smaller factor is (a − b)² + b², which is at least 1 and equals 1 only when a = b = 1. So a⁴ + 4b⁴ is composite unless a = b = 1. To prove a number composite, you must show it is a product of two factors that are both bigger than 1 — that second half is where the marks are. Spot it when you see a fourth power plus 4 times a fourth power, e.g. n⁴ + 4, x⁴ + 324 = x⁴ + 4·3⁴, or n⁴ + 4ⁿ with n odd (4ⁿ = 4·(2^((n−1)/2))⁴). Classic trap: factoring correctly but not checking that the small factor is > 1.",steps:["Spot a⁴ + 4b⁴ (rewrite constants: 324 = 4·3⁴, 4ⁿ = 4·(2ᵏ)⁴ for n = 2k + 1).","Factor: (a² + 2ab + 2b²)(a² − 2ab + 2b²).","Write the small factor as (a − b)² + b² to show it is > 1.","Also handle easy cases separately (e.g. n even makes n⁴ + 4ⁿ even).","In products and quotients, the factors often telescope: (x − b)² + b² for one x equals (x′ + b)² + b² for x′ = x − 2b."],example:{q:"For which positive integers n is n⁴ + 4 a prime?",a:"n⁴ + 4 = (n² + 2n + 2)(n² − 2n + 2) and n² − 2n + 2 = (n − 1)² + 1. This is 1 only for n = 1, otherwise both factors are > 1. n = 1 gives 5, a prime. So only n = 1."},de:[["Identität von Sophie Germain","Sophie Germain identity"],["zusammengesetzte Zahl","composite number"],["zerlegen","factorise"],["echter Teiler","proper divisor"]]},problems:[{type:"answer",q:`Find the largest prime factor of

3⁴ + 4·5⁴ = 2581.`,answers:["89"],hints:["This is a⁴ + 4b⁴ with a = 3, b = 5.","Factor as (a² + 2ab + 2b²)(a² − 2ab + 2b²).","(9 + 30 + 50)(9 − 30 + 50)."],solution:"3⁴ + 4·5⁴ = (9 + 30 + 50)(9 − 30 + 50) = 89·29. Both are prime, so the largest prime factor is 89."},{type:"answer",q:`Compute

[(10⁴ + 324)(22⁴ + 324)(34⁴ + 324)(46⁴ + 324)(58⁴ + 324)] / [(4⁴ + 324)(16⁴ + 324)(28⁴ + 324)(40⁴ + 324)(52⁴ + 324)].`,answers:["373"],hints:["324 = 4·3⁴.","x⁴ + 324 = (x² + 6x + 18)(x² − 6x + 18) = ((x + 3)² + 9)((x − 3)² + 9).","For x = 10 you get (13² + 9)(7² + 9); for x = 4 you get (7² + 9)(1² + 9). What cancels?"],solution:`x⁴ + 324 = ((x + 3)² + 9)((x − 3)² + 9). Write f(t) = t² + 9.

Numerator: f(13)f(7)·f(25)f(19)·f(37)f(31)·f(49)f(43)·f(61)f(55).
Denominator: f(7)f(1)·f(19)f(13)·f(31)f(25)·f(43)f(37)·f(55)f(49).

Everything cancels except f(61)/f(1) = 3730/10 = 373.`},{type:"proof",q:"Let a, b be positive integers. Prove that a⁴ + 4b⁴ is prime only when a = b = 1.",hints:["Complete the square: a⁴ + 4b⁴ = (a² + 2b²)² − 4a²b².","Difference of squares gives two factors.","The smaller factor is (a − b)² + b². When is it 1?"],keySteps:["a⁴ + 4b⁴ = (a² + 2b²)² − (2ab)² = (a² + 2ab + 2b²)(a² − 2ab + 2b²).","The small factor is (a − b)² + b² ≥ b² ≥ 1, with equality only if b = 1 and a = b, i.e. a = b = 1.","The big factor is a² + 2ab + 2b² ≥ 5 > 1.","So if (a, b) ≠ (1, 1) both factors are > 1 and the number is composite; a = b = 1 gives 5, prime."],solution:`a⁴ + 4b⁴ = a⁴ + 4a²b² + 4b⁴ − 4a²b² = (a² + 2b²)² − (2ab)² = (a² + 2ab + 2b²)(a² − 2ab + 2b²).

The first factor is at least 1 + 2 + 2 = 5. The second is (a − b)² + b² ≥ 1, and it equals 1 only if b = 1 and a = b, i.e. a = b = 1.

So for (a, b) ≠ (1, 1) the number is a product of two integers greater than 1, hence composite. For a = b = 1 it is 5, a prime. So a⁴ + 4b⁴ is prime only for a = b = 1.`}],challenge:{source:"Classic",q:"Prove that n⁴ + 4ⁿ is composite for every integer n > 1.",keySteps:["n even: n⁴ and 4ⁿ are both even, so n⁴ + 4ⁿ is even and greater than 2: composite.","n odd, n = 2k + 1 with k ≥ 1: 4ⁿ = 4·4²ᵏ = 4·(2ᵏ)⁴.","So n⁴ + 4ⁿ = a⁴ + 4b⁴ with a = n, b = 2ᵏ.","By the proof problem it is composite unless a = b = 1, but b = 2ᵏ ≥ 2.","Explicitly: (n² + 2ᵏ⁺¹n + 2²ᵏ⁺¹)(n² − 2ᵏ⁺¹n + 2²ᵏ⁺¹), small factor (n − 2ᵏ)² + 4ᵏ ≥ 4."],solution:`If n is even, then n⁴ + 4ⁿ is even and larger than 2, so it is composite.

If n is odd, write n = 2k + 1 with k ≥ 1. Then 4ⁿ = 4·4²ᵏ = 4·(2ᵏ)⁴, so

n⁴ + 4ⁿ = a⁴ + 4b⁴ with a = n, b = 2ᵏ.

By Sophie Germain, a⁴ + 4b⁴ = (a² + 2ab + 2b²)(a² − 2ab + 2b²), and the smaller factor is (a − b)² + b² ≥ b² = 4ᵏ ≥ 4 > 1. The larger factor is bigger still. So n⁴ + 4ⁿ is a product of two integers greater than 1: composite.`}},94:{lesson:{idea:"To show a quotient of factorials is an integer, there are two standard ways. Counting: if it counts something, it is an integer. (3n)!/(n!)³ is the number of ways to arrange n letters A, n letters B and n letters C in a row. Legendre: show that for every prime p the numerator has at least as many factors p as the denominator. With ν_p(m!) = Σ ⌊m/pᵏ⌋, everything reduces to an inequality for the floor function, like ⌊3x⌋ ≥ 3⌊x⌋ or ⌊x + y⌋ ≥ ⌊x⌋ + ⌊y⌋, applied with x = n/pᵏ. Two more facts: p divides the binomial coefficient C(p, k) for 0 < k < p (the p in p! can’t cancel), and Kummer: ν_p(C(m + n, n)) equals the number of carries when you add m and n in base p. Classic trap: a counting argument only works if the number really counts something — check that you are not dividing by too much.",steps:["Try counting first: arrangements of a word with repeated letters give multinomial coefficients.","Otherwise use Legendre: show ν_p(numerator) ≥ ν_p(denominator) for every prime p.","That reduces to a floor inequality for each term ⌊m/pᵏ⌋; prove it by writing x = ⌊x⌋ + {x}.","For ν_p of one binomial coefficient: count carries in base p (Kummer).","C(n, k) is odd exactly when every binary 1 of k is also a 1 of n (Lucas)."],example:{q:"Why does a prime p divide C(p, k) for 0 < k < p?",a:"C(p, k) = p!/(k!(p − k)!). The numerator contains the factor p. The denominator is a product of numbers smaller than p, so it has no factor p. Since C(p, k) is an integer, p divides it."},de:[["Binomialkoeffizient","binomial coefficient"],["ganzzahlig","integer (adj.)"],["Gaußklammer","floor function"],["Übertrag","carry"],["Multinomialkoeffizient","multinomial coefficient"]]},problems:[{type:"answer",q:"Find the largest k such that 2ᵏ divides the binomial coefficient C(100, 50).",answers:["3"],hints:["Use Legendre: ν_2(100!) − 2·ν_2(50!).","ν_2(100!) = 97 and ν_2(50!) = 25 + 12 + 6 + 3 + 1.","Or: count the carries when adding 50 + 50 in binary."],solution:"ν_2(100!) = 50 + 25 + 12 + 6 + 3 + 1 = 97 and ν_2(50!) = 25 + 12 + 6 + 3 + 1 = 47. So ν_2(C(100, 50)) = 97 − 94 = 3. (Kummer: 50 = 110010₂ has three 1s, and each gives a carry when you add 50 + 50.)"},{type:"answer",q:"How many of the 101 numbers C(100, 0), C(100, 1), …, C(100, 100) are odd?",answers:["8"],hints:["Write 100 in binary.","100 = 1100100₂.","C(100, k) is odd exactly when k has 1s only where 100 does (no carries when adding k and 100 − k)."],solution:"C(100, k) is odd iff adding k and 100 − k in binary has no carry, i.e. iff every binary 1 of k sits where 100 = 1100100₂ has a 1. 100 has three 1s, and each can be on or off in k: 2³ = 8 values of k."},{type:"proof",q:"Prove that (3n)!/(n!)³ is an integer for every positive integer n.",hints:["What does (3n)!/(n!)³ count?","Arrange the letters AAA…BBB…CCC (n of each) in a row.","Or: C(3n, n)·C(2n, n) = (3n)!/(n!(2n)!)·(2n)!/(n!n!)."],keySteps:["Write (3n)!/(n!)³ = (3n)!/(n!(2n)!) · (2n)!/(n!n!).","That is C(3n, n)·C(2n, n), a product of binomial coefficients.","Binomial coefficients count subsets, so they are integers.","Hence (3n)!/(n!)³ is an integer. (Alternative: Legendre with ⌊3x⌋ ≥ 3⌊x⌋.)"],solution:`(3n)!/(n!)³ = [(3n)!/(n!·(2n)!)]·[(2n)!/(n!·n!)] = C(3n, n)·C(2n, n).

C(3n, n) counts the ways to choose the positions of the n letters A among 3n places, and C(2n, n) the positions of the B among the remaining 2n. Both are integers, so their product is too.

Alternative with Legendre: for every prime p and k ≥ 1, with x = n/pᵏ, we have ⌊3x⌋ ≥ 3⌊x⌋ (since 3x ≥ 3⌊x⌋ and the right side is an integer). Summing over k: ν_p((3n)!) ≥ 3ν_p(n!).`}],challenge:{source:"IMO 1972",q:`Let m and n be nonnegative integers. Prove that

(2m)!·(2n)! / (m!·n!·(m + n)!)

is an integer.`,keySteps:["By Legendre it suffices to show, for every prime p: Σₖ (⌊2m/pᵏ⌋ + ⌊2n/pᵏ⌋) ≥ Σₖ (⌊m/pᵏ⌋ + ⌊n/pᵏ⌋ + ⌊(m + n)/pᵏ⌋).","So prove ⌊2x⌋ + ⌊2y⌋ ≥ ⌊x⌋ + ⌊y⌋ + ⌊x + y⌋ for all real x, y ≥ 0.","Write x = ⌊x⌋ + a, y = ⌊y⌋ + b with a, b ∈ [0, 1). The integer parts cancel: it becomes ⌊2a⌋ + ⌊2b⌋ ≥ ⌊a + b⌋.","If a + b < 1 the right side is 0. If a + b ≥ 1, then a ≥ 1/2 or b ≥ 1/2, so the left side is ≥ 1 = right side.","Apply with x = m/pᵏ, y = n/pᵏ and sum over k."],solution:`It is enough to show that for every prime p, ν_p((2m)!) + ν_p((2n)!) ≥ ν_p(m!) + ν_p(n!) + ν_p((m + n)!). By Legendre, it suffices to prove for all real x, y ≥ 0:

⌊2x⌋ + ⌊2y⌋ ≥ ⌊x⌋ + ⌊y⌋ + ⌊x + y⌋,

and then apply it with x = m/pᵏ, y = n/pᵏ for each k ≥ 1 and add up.

Write x = X + a, y = Y + b with integers X, Y and a, b ∈ [0, 1). Then ⌊2x⌋ = 2X + ⌊2a⌋, ⌊2y⌋ = 2Y + ⌊2b⌋ and ⌊x + y⌋ = X + Y + ⌊a + b⌋. The inequality becomes ⌊2a⌋ + ⌊2b⌋ ≥ ⌊a + b⌋.

Since 0 ≤ a + b < 2, ⌊a + b⌋ is 0 or 1. If it is 0, the claim holds because the left side is ≥ 0. If it is 1, then a + b ≥ 1, so a ≥ 1/2 or b ≥ 1/2, and the left side is ≥ 1. Done.`}},98:{lesson:{idea:"A repunit is Rₙ = 11…1 (n ones) = (10ⁿ − 1)/9. Questions about Rₙ, 10ⁿ − 1 and 10ⁿ + 1 are questions about powers of 10 mod a prime p. For p ≠ 2, 3, 5: p | Rₙ ⟺ p | 10ⁿ − 1 ⟺ 10ⁿ ≡ 1 (mod p). The smallest such n is the order d of 10 mod p, and p | Rₙ exactly when d | n. Examples: 11 | Rₙ iff n is even (10 ≡ −1); 7 | Rₙ iff 6 | n; and 10³ + 1 = 1001 = 7·11·13, so every abcabc is divisible by 7, 11 and 13. Like aⁿ − 1, repunits satisfy gcd(R_m, R_n) = R_gcd(m, n) and R_m | R_n when m | n. Pigeonhole gives: every number coprime to 10 divides some repunit. Classic trap: the 9 in (10ⁿ − 1)/9 — for p = 3 you can’t use 10ⁿ − 1; instead 3 | Rₙ iff 3 | n (digit sum n), and 9 | Rₙ iff 9 | n.",steps:["Turn the question into 10ⁿ ≡ 1 or 10ⁿ ≡ −1 (mod p).","Find the order of 10 mod p by listing 10, 10², … mod p.","p | Rₙ ⟺ order | n (for primes p ≠ 2, 3, 5).","For 3 and 9 use the digit sum of Rₙ, which is n.","Use the factorisation R_{km} = R_m·(1 + 10ᵐ + 10²ᵐ + … + 10^((k−1)m))."],example:{q:"Show that every six-digit number of the form abcabc is divisible by 7, 11 and 13.",a:"abcabc = abc·1000 + abc = abc·1001, and 1001 = 10³ + 1 = 7·11·13."},de:[["Repunit (Einserzahl)","repunit"],["Ordnung","order (of 10 mod p)"],["Schubfachprinzip","pigeonhole principle"],["Periode","period"]]},problems:[{type:"answer",q:"What is the smallest n such that the repunit Rₙ = 11…1 (n ones) is divisible by 41?",answers:["5"],hints:["You need 10ⁿ ≡ 1 (mod 41).","Compute 10, 10², 10³, … mod 41.","10² = 100 ≡ 18, 10³ ≡ 180 ≡ 16, 10⁴ ≡ 160 ≡ 37, 10⁵ ≡ 370 ≡ 1."],solution:"41 ∤ 9, so 41 | Rₙ iff 10ⁿ ≡ 1 (mod 41). Powers of 10 mod 41: 10, 18, 16, 37, 1. So n = 5. Indeed 11111 = 41·271."},{type:"answer",q:"For how many n with 1 ≤ n ≤ 100 is the repunit Rₙ divisible by 77?",answers:["16"],hints:["77 = 7·11. Find when each one divides Rₙ.","11 | Rₙ iff n is even (alternating digit sum).","Powers of 10 mod 7: 3, 2, 6, 4, 5, 1 — so 7 | Rₙ iff 6 | n."],solution:"11 | Rₙ iff its alternating digit sum is ≡ 0 (mod 11), i.e. iff n is even. 7 | Rₙ iff 7 | 10ⁿ − 1 (as gcd(7, 9) = 1), and 10 has order 6 mod 7 (10 ≡ 3, then 2, 6, 4, 5, 1), so iff 6 | n. Both hold iff 6 | n: n = 6, 12, …, 96, which is 16 values."},{type:"proof",q:"Prove that every positive integer m with gcd(m, 10) = 1 divides some repunit Rₙ = 11…1.",hints:["Look at R₁, R₂, …, R_{m+1} mod m.","Two of them leave the same remainder (pigeonhole).","R_j − R_i = 11…100…0 = R_{j−i}·10ⁱ."],keySteps:["Among R₁, …, R_{m+1} there are m + 1 numbers but only m remainders mod m, so two, R_i and R_j with i < j, are congruent.","R_j − R_i = R_{j−i}·10ⁱ (j − i ones followed by i zeros).","So m | R_{j−i}·10ⁱ.","gcd(m, 10) = 1, so gcd(m, 10ⁱ) = 1 and m | R_{j−i}."],solution:`Consider the m + 1 numbers R₁, R₂, …, R_{m+1}. There are only m possible remainders mod m, so by the pigeonhole principle two of them, say R_i and R_j with i < j, leave the same remainder. Then m | R_j − R_i.

R_j − R_i is the number with j − i ones followed by i zeros, i.e. R_{j−i}·10ⁱ. Since gcd(m, 10) = 1, m is coprime to 10ⁱ, so m | R_{j−i}. So m divides the repunit R_{j−i}.`}],challenge:{source:"Classic",q:"Let k ≥ 1. Prove that the repunit made of 3ᵏ ones is divisible by 3ᵏ but not by 3ᵏ⁺¹.",keySteps:["Factor R_{3m} = R_m·(10²ᵐ + 10ᵐ + 1) (three blocks of m ones).","The second factor has digit sum 3, so it is divisible by 3 but not by 9.","Hence ν_3(R_{3m}) = ν_3(R_m) + 1.","Start: R₁ = 1 has ν_3 = 0. By induction ν_3(R_{3ᵏ}) = k.","So 3ᵏ divides R_{3ᵏ} and 3ᵏ⁺¹ does not."],solution:`For any m, the number with 3m ones splits into three blocks of m ones:

R_{3m} = R_m·10²ᵐ + R_m·10ᵐ + R_m = R_m·(10²ᵐ + 10ᵐ + 1).

The number 10²ᵐ + 10ᵐ + 1 has three digits 1 and the rest 0, so its digit sum is 3: it is divisible by 3 but not by 9, i.e. ν_3(10²ᵐ + 10ᵐ + 1) = 1. Hence

ν_3(R_{3m}) = ν_3(R_m) + 1.

Now induct on k. R₁ = 1, so ν_3(R_{3⁰}) = 0. If ν_3(R_{3ᵏ⁻¹}) = k − 1, then ν_3(R_{3ᵏ}) = k. So for every k ≥ 1, 3ᵏ divides R_{3ᵏ} exactly: 3ᵏ | R_{3ᵏ} and 3ᵏ⁺¹ ∤ R_{3ᵏ}.`}}};export{e as default};
