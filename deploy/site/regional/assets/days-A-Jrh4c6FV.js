const e={38:{lesson:{idea:`You can divide polynomials just like numbers: p(x) = d(x)·q(x) + r(x), where the remainder r has smaller degree than the divisor d. Dividing by x − a is the most important case, and the Horner scheme does it in one line: write the coefficients, bring the first one down, then repeatedly multiply by a and add the next coefficient. The numbers you get are the coefficients of q; the last number is the remainder.

Why it matters: the remainder on division by x − a is exactly p(a) (remainder theorem), because p(x) = (x − a)·q(x) + r and putting x = a kills the first part. So Horner is also the fastest way to evaluate p(a), and p(a) = 0 means x − a is a factor.`,steps:["Write all coefficients, from the highest power down. Missing powers get a 0 — the classic mistake is to forget them.","Horner for x − a: bring down the first coefficient; then (last number)·a + next coefficient, again and again.","Last number = remainder = p(a). The others are the coefficients of the quotient (one degree lower).","Dividing by a quadratic like (x − a)(x − b): the remainder is linear, r(x) = cx + d. Find c and d from p(a) = r(a) and p(b) = r(b)."],example:{q:"Divide p(x) = x³ − 4x² + 5x − 7 by x − 2.",a:`Coefficients 1, −4, 5, −7 and a = 2.
1 → 1·2 − 4 = −2 → (−2)·2 + 5 = 1 → 1·2 − 7 = −5.
So x³ − 4x² + 5x − 7 = (x − 2)(x² − 2x + 1) − 5. Check: p(2) = 8 − 16 + 10 − 7 = −5. ✓`},de:[["Polynomdivision","polynomial division"],["Horner-Schema","Horner scheme"],["Rest","remainder"],["Koeffizient","coefficient"],["Grad","degree"]]},problems:[{type:"answer",q:"Find the remainder when 2x⁴ − 5x³ + x² − 4x + 6 is divided by x − 3.",answers:["30"],hints:["You don’t have to do the long division. What is the remainder on division by x − a?","The remainder is p(3). Horner computes it quickly.","Coefficients 2, −5, 1, −4, 6: 2 → 2·3 − 5 = 1 → …"],solution:`Horner with a = 3: 2 → 2·3 − 5 = 1 → 1·3 + 1 = 4 → 4·3 − 4 = 8 → 8·3 + 6 = 30.

The remainder is p(3) = 30 (and the quotient is 2x³ + x² + 4x + 8).`},{type:"answer",q:`A polynomial p leaves remainder 5 when divided by x − 1 and remainder −1 when divided by x + 2.

Let r(x) be the remainder when p is divided by (x − 1)(x + 2). Find r(10).`,answers:["23"],hints:["The divisor has degree 2. What degree does the remainder have?","Write p(x) = (x − 1)(x + 2)·q(x) + ax + b and put in x = 1 and x = −2.","p(1) = 5 and p(−2) = −1 by the remainder theorem."],solution:`Write p(x) = (x − 1)(x + 2)·q(x) + ax + b. Putting x = 1: a + b = p(1) = 5. Putting x = −2: −2a + b = p(−2) = −1.

Subtracting gives 3a = 6, so a = 2 and b = 3. So r(x) = 2x + 3 and r(10) = 23.`},{type:"proof",q:`Let p be a polynomial with integer coefficients, and let a and b be different integers.

Prove that a − b divides p(a) − p(b).`,hints:["Look at one term cₖxᵏ at a time.","cₖaᵏ − cₖbᵏ = cₖ(aᵏ − bᵏ). Can you factor aᵏ − bᵏ?","aᵏ − bᵏ = (a − b)(aᵏ⁻¹ + aᵏ⁻²b + … + bᵏ⁻¹)."],keySteps:["Write p(x) = cₙxⁿ + … + c₁x + c₀ with integers cₖ.","p(a) − p(b) = Σ cₖ(aᵏ − bᵏ); the constant term cancels.","aᵏ − bᵏ = (a − b)(aᵏ⁻¹ + aᵏ⁻²b + … + bᵏ⁻¹), and the second factor is an integer.","So every term is divisible by a − b, and so is the sum."],solution:`Let p(x) = cₙxⁿ + … + c₁x + c₀ with integers cₖ. Then
p(a) − p(b) = cₙ(aⁿ − bⁿ) + … + c₁(a − b),
because c₀ cancels.

For every k ≥ 1, aᵏ − bᵏ = (a − b)(aᵏ⁻¹ + aᵏ⁻²b + … + abᵏ⁻² + bᵏ⁻¹), and the second bracket is an integer. So each term cₖ(aᵏ − bᵏ) is an integer multiple of a − b, and therefore so is their sum p(a) − p(b).`}],challenge:{source:"Classic",q:"Determine the remainder when x²⁰²⁷ is divided by x² + x + 1. Prove your answer.",keySteps:["x³ − 1 = (x − 1)(x² + x + 1), so x² + x + 1 divides x³ − 1.","Hence x² + x + 1 divides x³ᵏ − 1 = (x³ − 1)(x³ᵏ⁻³ + … + 1) for every k ≥ 1.","2027 = 3·675 + 2, so x²⁰²⁷ − x² = x²(x²⁰²⁵ − 1) is divisible by x² + x + 1.","x² = (x² + x + 1) − x − 1, so the remainder is −x − 1 (degree < 2, so it is the remainder)."],solution:`Since x³ − 1 = (x − 1)(x² + x + 1), the polynomial x² + x + 1 divides x³ − 1. It then also divides x²⁰²⁵ − 1 = (x³)⁶⁷⁵ − 1, because uᵏ − 1 = (u − 1)(uᵏ⁻¹ + … + 1) with u = x³.

So x²⁰²⁷ − x² = x²(x²⁰²⁵ − 1) is a multiple of x² + x + 1. Also x² = 1·(x² + x + 1) + (−x − 1). Together
x²⁰²⁷ = (multiple of x² + x + 1) + (−x − 1).

The remainder has degree less than 2, so it is −x − 1.`}},42:{lesson:{idea:`If a polynomial with integer coefficients aₙxⁿ + … + a₁x + a₀ has an integer root r, then r divides a₀. Reason: put r in and move a₀ over: a₀ = −r·(aₙrⁿ⁻¹ + … + a₁), and the bracket is an integer. More generally, a rational root p/q (in lowest terms) has p | a₀ and q | aₙ.

So a cubic that looks hopeless often has a root among the few divisors of a₀. Find it, split off the linear factor x − r with Horner, and you are left with a quadratic you can solve.`,steps:["List the divisors of a₀ — positive AND negative.","Test them (Horner gives p(r) quickly). Small ones first: ±1, ±2, …","When p(r) = 0, Horner also gives the quotient: p(x) = (x − r)·q(x).","Solve q(x) = 0. Trap: the test only gives candidates; a polynomial may have no integer root at all."],example:{q:"Solve x³ − 6x² + 11x − 6 = 0.",a:"Candidates: ±1, ±2, ±3, ±6. p(1) = 1 − 6 + 11 − 6 = 0. Horner: 1 → −5 → 6 → 0, so p(x) = (x − 1)(x² − 5x + 6) = (x − 1)(x − 2)(x − 3). Solutions 1, 2, 3."},de:[["ganzzahlige Nullstelle","integer root"],["Linearfaktor abspalten","split off a linear factor"],["ganzzahlige Koeffizienten","integer coefficients"],["Absolutglied","constant term"],["Teiler","divisor"]]},problems:[{type:"answer",q:"The equation x³ + x² − 7x − 3 = 0 has exactly one integer solution. Find it.",answers:["-3"],hints:["An integer root must divide the constant term.","The candidates are ±1 and ±3.","Try x = −3: −27 + 9 + 21 − 3."],solution:`An integer root divides −3, so it is one of ±1, ±3. p(1) = −8, p(−1) = 4, p(3) = 12, p(−3) = −27 + 9 + 21 − 3 = 0.

So x = −3. (Horner gives x³ + x² − 7x − 3 = (x + 3)(x² − 2x − 1); the other roots 1 ± √2 are not integers.)`},{type:"answer",q:`Find the smallest positive solution of

2x³ − 3x² − 11x + 6 = 0.`,answers:["1/2","0.5"],hints:["A rational root p/q has p | 6 and q | 2.","Find an integer root first: try divisors of 6.","x = 3 works: 54 − 27 − 33 + 6 = 0. Split off x − 3."],solution:`p(3) = 54 − 27 − 33 + 6 = 0. Horner with 3: 2 → 3 → −2 → 0, so
2x³ − 3x² − 11x + 6 = (x − 3)(2x² + 3x − 2) = (x − 3)(2x − 1)(x + 2).

The solutions are 3, 1/2 and −2; the smallest positive one is 1/2.`},{type:"proof",q:`Let p be a polynomial with integer coefficients such that p(0) and p(1) are both odd.

Prove that p has no integer root.`,hints:["Every integer is even or odd. Compare p(n) with p(0) or p(1).","Use the fact from day 38: a − b divides p(a) − p(b).","If n is even, 2 divides n − 0, so p(n) ≡ p(0) (mod 2)."],keySteps:["For integers a, b: a − b divides p(a) − p(b).","If n is even, 2 | n − 0, so p(n) ≡ p(0) ≡ 1 (mod 2).","If n is odd, 2 | n − 1, so p(n) ≡ p(1) ≡ 1 (mod 2).","So p(n) is odd for every integer n, hence never 0."],solution:`Recall that for integers a and b, a − b divides p(a) − p(b) (each aᵏ − bᵏ is divisible by a − b).

Let n be any integer. If n is even, then 2 divides n − 0, so 2 divides p(n) − p(0), and p(n) has the same parity as p(0): odd. If n is odd, then 2 divides n − 1, so p(n) has the same parity as p(1): odd again.

So p(n) is odd for every integer n. Since 0 is even, p(n) ≠ 0: p has no integer root.`}],challenge:{source:"Classic",q:`A polynomial p with integer coefficients takes the value 5 at four different integers a, b, c, d.

Prove that there is no integer k with p(k) = 8.`,keySteps:["p(x) − 5 has the roots a, b, c, d, so p(x) − 5 = (x − a)(x − b)(x − c)(x − d)·q(x).","q has integer coefficients (dividing by monic linear factors keeps integer coefficients).","If p(k) = 8, then 3 = (k − a)(k − b)(k − c)(k − d)·q(k) is a product of four DIFFERENT integers and an integer.","Each factor divides 3, so lies in {1, −1, 3, −3}; four different ones use all four and their product has absolute value 9 > 3. Contradiction."],solution:`p(x) − 5 has the four different roots a, b, c, d. Splitting them off one by one (Horner with an integer a keeps integer coefficients) gives
p(x) − 5 = (x − a)(x − b)(x − c)(x − d)·q(x)
with q having integer coefficients.

Suppose p(k) = 8 for an integer k. Then
3 = (k − a)(k − b)(k − c)(k − d)·q(k).
The numbers k − a, k − b, k − c, k − d are four different integers, and each of them divides 3, so each is one of 1, −1, 3, −3. Four different ones must be exactly 1, −1, 3, −3, whose product is 9. Then 9 divides 3, which is false.

So p(k) = 8 is impossible.`}},46:{lesson:{idea:`If x³ + ax² + bx + c has roots r, s, t, then x³ + ax² + bx + c = (x − r)(x − s)(x − t). Multiply out and compare coefficients:
r + s + t = −a,  rs + st + tr = b,  rst = −c.
For degree 4, x⁴ + ax³ + bx² + cx + d: sum of roots −a, sum of products of pairs b, of triples −c, product of all four d. The signs alternate.

The expressions e₁ = r + s + t, e₂ = rs + st + tr, e₃ = rst are the elementary symmetric polynomials. Every symmetric expression in r, s, t can be written in e₁, e₂, e₃ — so you can compute it without knowing the roots. The two you need most:
r² + s² + t² = e₁² − 2e₂,
r³ + s³ + t³ = e₁³ − 3e₁e₂ + 3e₃.`,steps:["Make the polynomial monic (leading coefficient 1) first, or divide by the leading coefficient in the formulas.","Write down e₁, e₂, e₃ with the right signs (alternating: −, +, −).","Rewrite the wanted expression in e₁, e₂, e₃: put fractions on a common denominator, use the two formulas above.","Works backwards too: given e₁, e₂, e₃, the numbers are the roots of x³ − e₁x² + e₂x − e₃."],example:{q:"r, s, t are the roots of x³ − 2x² + 3x − 4. Find r² + s² + t².",a:"e₁ = 2, e₂ = 3, so r² + s² + t² = 4 − 6 = −2. Negative! So not all roots are real — and you didn’t need to find them."},de:[["Satz von Vieta","Vieta’s formulas"],["elementarsymmetrische Polynome","elementary symmetric polynomials"],["Nullstelle","root (zero)"],["normiert","monic"],["Koeffizientenvergleich","comparing coefficients"]]},problems:[{type:"answer",q:`r, s, t are the roots of x³ − 5x² + 6x − 1.

Find 1/r + 1/s + 1/t.`,answers:["6"],hints:["Put the three fractions on one denominator.","1/r + 1/s + 1/t = (st + rt + rs)/(rst) = e₂/e₃.","Here e₂ = 6 and e₃ = 1."],solution:"1/r + 1/s + 1/t = (rs + st + tr)/(rst) = e₂/e₃. By Vieta e₂ = 6 and e₃ = 1, so the answer is 6."},{type:"answer",q:`r, s, t are the roots of x³ − 5x² + 6x − 1.

Find r³ + s³ + t³.`,answers:["38"],hints:["Use e₁ = 5, e₂ = 6, e₃ = 1.","r³ + s³ + t³ = e₁³ − 3e₁e₂ + 3e₃.","Or: each root satisfies r³ = 5r² − 6r + 1. Add the three equations."],solution:`e₁ = 5, e₂ = 6, e₃ = 1, so r³ + s³ + t³ = 125 − 90 + 3 = 38.

Check another way: r³ = 5r² − 6r + 1 for each root. Adding, r³ + s³ + t³ = 5(r² + s² + t²) − 6·5 + 3 = 5·(25 − 12) − 27 = 38.`},{type:"proof",q:`Let a, b, c be real numbers with a + b + c = 0.

Prove that a³ + b³ + c³ = 3abc.`,hints:["a, b, c are the roots of a cubic. Which one?","They are the roots of x³ − e₁x² + e₂x − e₃, and here e₁ = 0.","So each of them satisfies x³ = −e₂x + e₃. Add up."],keySteps:["a, b, c are the roots of (x − a)(x − b)(x − c) = x³ − e₁x² + e₂x − e₃ with e₁ = 0.","So a³ = −e₂a + e₃, and the same for b and c.","Adding: a³ + b³ + c³ = −e₂(a + b + c) + 3e₃ = 3e₃.","e₃ = abc."],solution:`Let e₂ = ab + bc + ca and e₃ = abc. Then (x − a)(x − b)(x − c) = x³ − (a + b + c)x² + e₂x − e₃ = x³ + e₂x − e₃, because a + b + c = 0.

Putting x = a gives a³ + e₂a − e₃ = 0, i.e. a³ = −e₂a + e₃; likewise for b and c. Adding the three equations:
a³ + b³ + c³ = −e₂(a + b + c) + 3e₃ = 0 + 3abc.`}],challenge:{source:"Classic",q:`The real numbers a, b, c satisfy a + b + c = 6 and ab + bc + ca = 9.

Prove that 0 ≤ a ≤ 4. When does a = 0 and when does a = 4 hold?`,keySteps:["b + c = 6 − a and bc = 9 − a(b + c) = 9 − a(6 − a) = (a − 3)².","b and c are real roots of x² − (6 − a)x + (a − 3)², so the discriminant is ≥ 0: (6 − a)² ≥ 4(a − 3)².","(6 − a)² − 4(a − 3)² = (12 − 3a)·a ≥ 0, which gives 0 ≤ a ≤ 4.","Equality: a = 0 forces b = c = 3; a = 4 forces b = c = 1 (discriminant 0, double root). Both triples satisfy the conditions."],solution:`From the conditions, b + c = 6 − a and
bc = 9 − a(b + c) = 9 − 6a + a² = (a − 3)².
So by Vieta, b and c are the roots of x² − (6 − a)x + (a − 3)². They are real, so the discriminant is non-negative:
(6 − a)² − 4(a − 3)² ≥ 0.
This is a difference of squares: (6 − a − 2a + 6)(6 − a + 2a − 6) = (12 − 3a)·a ≥ 0. So a and 12 − 3a are not of opposite sign, which means 0 ≤ a ≤ 4.

Equality: a = 0 or a = 4 exactly when the discriminant is 0, so b = c = (6 − a)/2. For a = 0 this gives (a, b, c) = (0, 3, 3); for a = 4 it gives (4, 1, 1). Both satisfy a + b + c = 6 and ab + bc + ca = 9, so the bounds are attained.`}},50:{lesson:{idea:`Some equations of degree 4 are secretly quadratic. Three tricks:

1. Only even powers (biquadratic): ax⁴ + bx² + c = 0. Put u = x². Each solution u > 0 gives x = ±√u, u = 0 gives x = 0, and u < 0 gives no real x.

2. Reciprocal (palindromic) polynomials: the coefficients read the same forwards and backwards, like x⁴ − 4x³ + 5x² − 4x + 1. x = 0 is not a root, so divide by x²: x² + 1/x² − 4(x + 1/x) + 5 = 0. Put u = x + 1/x; then x² + 1/x² = u² − 2, and you get a quadratic in u.

3. A palindromic polynomial of odd degree always has the root x = −1. Split off x + 1 and the rest is palindromic of even degree.`,steps:["Spot the symmetry: only even powers? Palindromic coefficients?","Substitute and solve the quadratic in u.","Go back to x: x² = u, or x + 1/x = u, i.e. x² − ux + 1 = 0.","The classic trap: for real x ≠ 0, |x + 1/x| ≥ 2. A value of u with |u| < 2 gives no real x — throw it away."],example:{q:"Solve x⁴ − 5x² + 4 = 0.",a:"u = x²: u² − 5u + 4 = (u − 1)(u − 4) = 0, so u = 1 or u = 4. Then x = ±1 or x = ±2."},de:[["Substitution","substitution"],["biquadratische Gleichung","biquadratic equation"],["reziprokes (symmetrisches) Polynom","reciprocal (palindromic) polynomial"],["reelle Lösung","real solution"]]},problems:[{type:"answer",q:"How many real solutions does x⁴ − 3x² − 4 = 0 have?",answers:["2"],hints:["Only even powers appear.","Put u = x² and solve u² − 3u − 4 = 0.","u = 4 or u = −1. Which of these can be x²?"],solution:"With u = x²: u² − 3u − 4 = (u − 4)(u + 1) = 0, so u = 4 or u = −1. x² = −1 has no real solution; x² = 4 gives x = ±2. So there are 2 real solutions."},{type:"answer",q:`Find the sum of all real solutions of

x⁴ − 4x³ + 5x² − 4x + 1 = 0.`,answers:["3"],hints:["Read the coefficients 1, −4, 5, −4, 1 backwards.","Divide by x² and put u = x + 1/x. Remember x² + 1/x² = u² − 2.","You get u² − 4u + 3 = 0. Now check which u give real x."],solution:`x = 0 is not a solution, so divide by x²: (x² + 1/x²) − 4(x + 1/x) + 5 = 0. With u = x + 1/x this is u² − 2 − 4u + 5 = u² − 4u + 3 = 0, so u = 1 or u = 3.

u = 1 gives no real x, since |x + 1/x| ≥ 2. u = 3 gives x² − 3x + 1 = 0 with the two real roots (3 ± √5)/2. Their sum is 3.

(Vieta for the quartic would give 4 — the sum of ALL four complex roots. That is the trap.)`},{type:"proof",q:"Prove that x⁴ + x³ + x² + x + 1 = 0 has no real solution.",hints:["The coefficients are palindromic.","Divide by x² and put u = x + 1/x.","You get u² + u − 1 = 0. How big can |u| be?"],keySteps:["x = 0 is not a solution, so we may divide by x²: (x² + 1/x²) + (x + 1/x) + 1 = 0.","With u = x + 1/x: u² + u − 1 = 0, so u = (−1 ± √5)/2.","Both values have |u| < 2 (≈ 0.618 and ≈ −1.618).","For real x ≠ 0, |x + 1/x| ≥ 2 (e.g. x² + 1 − 2|x| = (|x| − 1)² ≥ 0). So no real x gives such u."],solution:`x = 0 is not a solution. For x ≠ 0, divide by x²:
(x² + 1/x²) + (x + 1/x) + 1 = 0.
Put u = x + 1/x; then x² + 1/x² = u² − 2, and the equation becomes u² + u − 1 = 0, so u = (−1 + √5)/2 or u = (−1 − √5)/2. Since 2 < √5 < 3, both values satisfy |u| < 2.

But for real x ≠ 0: |x + 1/x| = |x| + 1/|x| (x and 1/x have the same sign), and |x| + 1/|x| ≥ 2 because x² + 1 − 2|x| = (|x| − 1)² ≥ 0. So u = x + 1/x can never have |u| < 2, and the equation has no real solution.`}],challenge:{source:"Classic",q:`Determine all real solutions of

2x⁴ + 3x³ − 16x² + 3x + 2 = 0.`,keySteps:["The coefficients 2, 3, −16, 3, 2 are palindromic and x = 0 is not a solution: divide by x².","With u = x + 1/x: 2(u² − 2) + 3u − 16 = 2u² + 3u − 20 = (2u − 5)(u + 4) = 0.","u = 5/2: 2x² − 5x + 2 = 0, x = 2 or x = 1/2.","u = −4: x² + 4x + 1 = 0, x = −2 ± √3. All four are real (|u| ≥ 2 in both cases); check that nothing was lost."],solution:`x = 0 is not a solution, so divide by x²:
2(x² + 1/x²) + 3(x + 1/x) − 16 = 0.
With u = x + 1/x and x² + 1/x² = u² − 2:
2u² + 3u − 20 = 0, i.e. (2u − 5)(u + 4) = 0.

u = 5/2: x + 1/x = 5/2 ⇔ 2x² − 5x + 2 = 0 ⇔ (2x − 1)(x − 2) = 0, so x = 2 or x = 1/2.
u = −4: x + 1/x = −4 ⇔ x² + 4x + 1 = 0, so x = −2 + √3 or x = −2 − √3.

Every step was an equivalence for x ≠ 0, so the solutions are exactly 2, 1/2, −2 + √3, −2 − √3.`}},54:{lesson:{idea:`Three factorizations you must know by heart:
xⁿ − yⁿ = (x − y)(xⁿ⁻¹ + xⁿ⁻²y + … + yⁿ⁻¹) for every n,
xⁿ + yⁿ = (x + y)(xⁿ⁻¹ − xⁿ⁻²y + … + yⁿ⁻¹) for ODD n,
x⁴ + x² + 1 = (x² + 1)² − x² = (x² + x + 1)(x² − x + 1).
The last one is the “add and subtract to make a difference of squares” trick. The same idea gives Sophie Germain: a⁴ + 4b⁴ = (a² + 2b²)² − (2ab)² = (a² + 2ab + 2b²)(a² − 2ab + 2b²).

In number theory these say: a − b divides aⁿ − bⁿ, and for odd n, a + b divides aⁿ + bⁿ. Great for showing something is divisible — or that a number is NOT prime.`,steps:["See aⁿ − bⁿ? Factor out a − b. If n is even, also aⁿ − bⁿ = (a^(n/2) − b^(n/2))(a^(n/2) + b^(n/2)).","See aⁿ + bⁿ with n odd? Factor out a + b.","See a sum of fourth powers, or x⁴ + x² + 1? Complete a square and use a² − b².","To prove “not prime”: factor, then show both factors are > 1. The trap is forgetting to check that the smaller factor is not 1."],example:{q:"Is 3¹⁰⁵ + 4¹⁰⁵ divisible by 7?",a:"105 is odd, so 3 + 4 = 7 divides 3¹⁰⁵ + 4¹⁰⁵. Yes."},de:[["Faktorisierung, Zerlegung","factorization"],["dritte binomische Formel","difference of squares"],["ungerade","odd"],["Primzahl","prime number"],["zusammengesetzt","composite"]]},problems:[{type:"answer",q:"Find the largest prime factor of 2¹² − 1.",answers:["13"],hints:["12 is even. Use a² − b² first.","2¹² − 1 = (2⁶ − 1)(2⁶ + 1) = 63·65.","Now factor 63 and 65."],solution:"2¹² − 1 = (2⁶ − 1)(2⁶ + 1) = 63·65 = 3²·7·5·13. The largest prime factor is 13."},{type:"answer",q:`Compute

1/(1⁴ + 1² + 1) + 2/(2⁴ + 2² + 1) + 3/(3⁴ + 3² + 1) + … + 10/(10⁴ + 10² + 1).`,answers:["55/111"],hints:["Factor k⁴ + k² + 1.","k⁴ + k² + 1 = (k² − k + 1)(k² + k + 1). The difference of the two factors is 2k.","So k/(k⁴ + k² + 1) = ½·[1/(k² − k + 1) − 1/(k² + k + 1)]. The sum telescopes."],solution:`k⁴ + k² + 1 = (k² − k + 1)(k² + k + 1), and (k² + k + 1) − (k² − k + 1) = 2k. So
k/(k⁴ + k² + 1) = ½·[1/(k² − k + 1) − 1/(k² + k + 1)].

Note k² + k + 1 = (k + 1)² − (k + 1) + 1, so each negative part cancels the next positive part. What remains is ½·(1/1 − 1/111) = ½·110/111 = 55/111.`},{type:"proof",q:"Prove that n⁴ + 4 is a prime number for exactly one positive integer n.",hints:["Make n⁴ + 4 a difference of squares by adding and subtracting 4n².","n⁴ + 4 = (n² + 2)² − (2n)².","Show that the smaller factor is > 1 when n ≥ 2."],keySteps:["n⁴ + 4 = (n² + 2)² − 4n² = (n² + 2n + 2)(n² − 2n + 2).","n = 1: n⁴ + 4 = 5 is prime.","n ≥ 2: n² − 2n + 2 = (n − 1)² + 1 ≥ 2, and the other factor is larger still.","So for n ≥ 2 it is a product of two factors ≥ 2, hence not prime."],solution:`n⁴ + 4 = n⁴ + 4n² + 4 − 4n² = (n² + 2)² − (2n)² = (n² + 2n + 2)(n² − 2n + 2).

For n = 1 we get 5, a prime.

For n ≥ 2: the factor n² − 2n + 2 = (n − 1)² + 1 ≥ 2, and n² + 2n + 2 is bigger than it. So n⁴ + 4 is a product of two integers that are both at least 2, hence not prime.

So n = 1 is the only positive integer for which n⁴ + 4 is prime.`}],challenge:{source:"Classic",q:"Let k be an odd positive integer. Prove that for every positive integer n, the sum 1ᵏ + 2ᵏ + … + nᵏ is divisible by 1 + 2 + … + n.",keySteps:["Let S = 1ᵏ + … + nᵏ. We must show n(n + 1)/2 divides S, i.e. n(n + 1) divides 2S.","Pair i with n + 1 − i: 2S = Σᵢ₌₁ⁿ (iᵏ + (n + 1 − i)ᵏ), and each bracket is divisible by n + 1 (k odd).","Pair i with n − i: 2S = Σᵢ₌₀ⁿ (iᵏ + (n − i)ᵏ), and each bracket is divisible by n. So n | 2S.","gcd(n, n + 1) = 1, so n(n + 1) | 2S, hence n(n + 1)/2 divides S."],solution:`Let S = 1ᵏ + 2ᵏ + … + nᵏ. Since 1 + 2 + … + n = n(n + 1)/2, it is enough to show that n(n + 1) divides 2S.

Because k is odd, a + b divides aᵏ + bᵏ for all integers a, b.

Divisible by n + 1: write the sum forwards and backwards and add:
2S = Σᵢ₌₁ⁿ [iᵏ + (n + 1 − i)ᵏ].
Each bracket is divisible by i + (n + 1 − i) = n + 1, so n + 1 divides 2S.

Divisible by n: in the same way, including the term 0ᵏ = 0,
2S = Σᵢ₌₀ⁿ [iᵏ + (n − i)ᵏ],
and each bracket is divisible by n. So n divides 2S.

Since n and n + 1 are coprime, n(n + 1) divides 2S, so n(n + 1)/2 divides S.`}},58:{lesson:{idea:`AM–GM for n non-negative numbers:
(x₁ + x₂ + … + xₙ)/n ≥ ⁿ√(x₁x₂⋯xₙ),
with equality exactly when all xᵢ are equal.

The art is choosing the terms. To find the minimum of a sum, split it into pieces whose PRODUCT is constant. Example: x² + 16/x. The product x²·(16/x) is not constant, but x² + 8/x + 8/x has product 64, so it is ≥ 3·∛64 = 12.

How do you know how to split? Guess the equality case first (all pieces equal), then choose the pieces so that this case is possible. In olympiad inequalities the equality case is often a = b = c; then AM–GM on terms that are all equal there.`,steps:["All numbers must be ≥ 0 (positive for products with fractions). Check!","Guess where equality holds.","Split or group the terms so that the product is constant and all pieces can be equal at the same time.","Always finish with the equality case: AM–GM is equality exactly when all pieces are equal. Check that this case is actually reachable — otherwise the bound is not the minimum."],example:{q:"Find the minimum of x + 4/x for x > 0.",a:"AM–GM: x + 4/x ≥ 2√(x·4/x) = 4, with equality when x = 4/x, i.e. x = 2. So the minimum is 4."},de:[["Mittelungleichung (AM-GM)","AM–GM inequality"],["arithmetisches / geometrisches Mittel","arithmetic / geometric mean"],["Gleichheit gilt genau dann, wenn …","equality holds if and only if …"],["positive reelle Zahlen","positive real numbers"]]},problems:[{type:"answer",q:"Find the minimum of x² + 16/x for x > 0.",answers:["12"],hints:["x²·(16/x) is not constant. Split one term into two equal pieces.","x² + 8/x + 8/x: the product of these three is 64.","AM–GM for three terms: sum ≥ 3·∛64. When are the three pieces equal?"],solution:`x² + 16/x = x² + 8/x + 8/x ≥ 3·∛(x²·8/x·8/x) = 3·∛64 = 12.

Equality when x² = 8/x, i.e. x³ = 8, x = 2. Check: 4 + 8 = 12. So the minimum is 12.`},{type:"answer",q:`x and y are positive real numbers with x + 2y = 6.

Find the largest possible value of x·y².`,answers:["8"],hints:["You want a fixed SUM of terms whose product is xy².","Write x + 2y = x + y + y.","AM–GM on x, y, y: (x + y + y)/3 ≥ ∛(xy²)."],solution:`AM–GM on x, y, y: 2 = (x + y + y)/3 ≥ ∛(xy²), so xy² ≤ 8.

Equality when x = y, i.e. x = y = 2 (then x + 2y = 6 ✓ and xy² = 8). So the maximum is 8.`},{type:"proof",q:`Let a, b, c be positive real numbers. Prove that

(a + b)(b + c)(c + a) ≥ 8abc,

and find when equality holds.`,hints:["Look at each bracket separately.","a + b ≥ 2√(ab).","Multiply the three inequalities (all sides are positive)."],keySteps:["AM–GM: a + b ≥ 2√(ab), b + c ≥ 2√(bc), c + a ≥ 2√(ca).","All sides are positive, so we may multiply: product ≥ 8√(a²b²c²) = 8abc.","Equality requires equality in each step: a = b, b = c, c = a.","So equality holds exactly when a = b = c."],solution:`By AM–GM, a + b ≥ 2√(ab), b + c ≥ 2√(bc) and c + a ≥ 2√(ca). All these numbers are positive, so we can multiply:
(a + b)(b + c)(c + a) ≥ 8√(ab·bc·ca) = 8abc.

Equality: if a = b = c, both sides are 8a³. Conversely, if equality holds, then each of the three inequalities must be an equality (otherwise the product is strictly bigger), so a = b, b = c, c = a. Equality holds exactly when a = b = c.`}],challenge:{source:"Classic",q:`Let a, b, c be positive real numbers. Prove that

a⁴ + b⁴ + c⁴ ≥ abc(a + b + c),

and determine when equality holds.`,keySteps:["The right side is a²bc + ab²c + abc². Get each of these terms by AM–GM with four terms.","a⁴ + a⁴ + b⁴ + c⁴ ≥ 4·⁴√(a⁸b⁴c⁴) = 4a²bc, and similarly for b²ca and c²ab.","Adding the three inequalities: 4(a⁴ + b⁴ + c⁴) ≥ 4abc(a + b + c).","Equality needs a⁴ = b⁴ = c⁴, i.e. a = b = c (positive); and a = b = c clearly gives equality."],solution:`The right side is a²bc + b²ca + c²ab. By AM–GM with four terms,
a⁴ + a⁴ + b⁴ + c⁴ ≥ 4·⁴√(a⁸b⁴c⁴) = 4a²bc,
b⁴ + b⁴ + c⁴ + a⁴ ≥ 4b²ca,
c⁴ + c⁴ + a⁴ + b⁴ ≥ 4c²ab.
Adding: 4(a⁴ + b⁴ + c⁴) ≥ 4(a²bc + b²ca + c²ab) = 4abc(a + b + c). Divide by 4.

Equality: if a = b = c, both sides equal 3a⁴. Conversely, equality in the sum forces equality in the first AM–GM, which needs a⁴ = b⁴ = c⁴, so a = b = c since they are positive. Equality holds exactly when a = b = c.`}},62:{lesson:{idea:`Cauchy–Schwarz: for real numbers a₁, …, aₙ and b₁, …, bₙ,
(a₁b₁ + … + aₙbₙ)² ≤ (a₁² + … + aₙ²)(b₁² + … + bₙ²),
with equality when the two lists are proportional.

The form you will use most in competitions is the Engel form (also called Titu’s lemma): for x₁, …, xₙ > 0,
a₁²/x₁ + … + aₙ²/xₙ ≥ (a₁ + … + aₙ)²/(x₁ + … + xₙ),
with equality when a₁/x₁ = a₂/x₂ = … = aₙ/xₙ.

Why is it true? For two terms, multiply out: (a²/x + b²/y)(x + y) ≥ (a + b)² is the same as a²y/x + b²x/y ≥ 2ab, i.e. (ay − bx)² ≥ 0. For more terms, apply the two-term version again and again.

When to reach for it: a sum of fractions with squares (or something you can make into squares) on top.`,steps:["Write each fraction as (something)²/(positive).","Apply Engel: (sum of the somethings)² over (sum of the denominators).","If a numerator is not a square, multiply top and bottom: a/(b + c) = a²/(a(b + c)).","Equality: all ratios aᵢ/xᵢ equal. Check it is possible under the conditions."],example:{q:"x, y > 0 with x + y = 1. Find the minimum of 1/x + 4/y.",a:"Engel: 1²/x + 2²/y ≥ (1 + 2)²/(x + y) = 9. Equality when 1/x = 2/y, i.e. y = 2x, so x = 1/3, y = 2/3. Minimum 9."},de:[["Cauchy-Schwarz-Ungleichung","Cauchy–Schwarz inequality"],["Engel-Form (Titus Lemma)","Engel form (Titu’s lemma)"],["proportional","proportional"],["Nenner / Zähler","denominator / numerator"]]},problems:[{type:"answer",q:`x, y, z are positive with x + y + z = 1.

Find the minimum of 1/x + 4/y + 9/z.`,answers:["36"],hints:["The numerators are squares: 1², 2², 3².","Engel form: ≥ (1 + 2 + 3)²/(x + y + z).","Equality when 1/x = 2/y = 3/z. Does that fit with x + y + z = 1?"],solution:`Engel: 1²/x + 2²/y + 3²/z ≥ (1 + 2 + 3)²/(x + y + z) = 36.

Equality when 1/x = 2/y = 3/z, i.e. x : y : z = 1 : 2 : 3, so x = 1/6, y = 1/3, z = 1/2. Check: 6 + 12 + 18 = 36. The minimum is 36.`},{type:"answer",q:`Real numbers a, b, c satisfy a² + b² + c² = 1.

Find the largest possible value of 2a + 3b + 6c.`,answers:["7"],hints:["2a + 3b + 6c is a sum of products: use Cauchy–Schwarz.","(2a + 3b + 6c)² ≤ (2² + 3² + 6²)(a² + b² + c²).","2² + 3² + 6² = 49. Equality when (a, b, c) is proportional to (2, 3, 6)."],solution:`Cauchy–Schwarz: (2a + 3b + 6c)² ≤ (4 + 9 + 36)(a² + b² + c²) = 49, so 2a + 3b + 6c ≤ 7.

Equality for (a, b, c) = (2/7, 3/7, 6/7): then a² + b² + c² = 49/49 = 1 and 2a + 3b + 6c = 49/7 = 7. The maximum is 7.`},{type:"proof",q:`Let a, b, c be positive real numbers. Prove that

a²/(b + c) + b²/(c + a) + c²/(a + b) ≥ (a + b + c)/2,

and find when equality holds.`,hints:["The numerators are already squares.","Engel: ≥ (a + b + c)²/((b + c) + (c + a) + (a + b)).","The denominator sum is 2(a + b + c)."],keySteps:["Engel form with numerators a, b, c and denominators b + c, c + a, a + b (all positive).","Sum ≥ (a + b + c)²/(2(a + b + c)) = (a + b + c)/2.","Equality in Engel: a/(b + c) = b/(c + a) = c/(a + b).","This holds exactly when a = b = c (e.g. a/(b + c) = b/(c + a) gives (a − b)(a + b + c) = 0)."],solution:`By the Engel form of Cauchy–Schwarz,
a²/(b + c) + b²/(c + a) + c²/(a + b) ≥ (a + b + c)²/((b + c) + (c + a) + (a + b)) = (a + b + c)²/(2(a + b + c)) = (a + b + c)/2.

Equality holds exactly when a/(b + c) = b/(c + a) = c/(a + b). From the first equation, a(c + a) = b(b + c), i.e. a² − b² + c(a − b) = (a − b)(a + b + c) = 0, so a = b; in the same way b = c. Conversely a = b = c gives equality. So equality holds exactly when a = b = c.`}],challenge:{source:"Nesbitt’s inequality (classic)",q:`Let a, b, c be positive real numbers. Prove that

a/(b + c) + b/(c + a) + c/(a + b) ≥ 3/2,

and determine when equality holds.`,keySteps:["Make the numerators squares: a/(b + c) = a²/(a(b + c)).","Engel: sum ≥ (a + b + c)²/(a(b + c) + b(c + a) + c(a + b)) = (a + b + c)²/(2(ab + bc + ca)).","(a + b + c)² ≥ 3(ab + bc + ca), because the difference is ½[(a − b)² + (b − c)² + (c − a)²] ≥ 0. So the sum is ≥ 3/2.","Equality needs a = b = c (from the last step); and a = b = c gives 3·½ = 3/2."],solution:`Write a/(b + c) = a²/(a(b + c)) and similarly for the others. By the Engel form,
a/(b + c) + b/(c + a) + c/(a + b) ≥ (a + b + c)²/(a(b + c) + b(c + a) + c(a + b)) = (a + b + c)²/(2(ab + bc + ca)).

Now (a + b + c)² − 3(ab + bc + ca) = a² + b² + c² − ab − bc − ca = ½[(a − b)² + (b − c)² + (c − a)²] ≥ 0. So (a + b + c)² ≥ 3(ab + bc + ca), and the sum is at least 3(ab + bc + ca)/(2(ab + bc + ca)) = 3/2.

Equality: the second step is an equality only if a = b = c. Conversely, a = b = c gives 1/2 + 1/2 + 1/2 = 3/2. So equality holds exactly when a = b = c.`}},66:{lesson:{idea:`Two tools for today.

1. For positive x₁, …, xₙ: (x₁ + … + xₙ)(1/x₁ + … + 1/xₙ) ≥ n², with equality when all xᵢ are equal. It is Engel with all numerators 1: Σ 1²/xᵢ ≥ n²/Σxᵢ. Or AM–GM on each bracket.

2. Rearrangement inequality: let a₁ ≤ a₂ ≤ … ≤ aₙ and b₁ ≤ b₂ ≤ … ≤ bₙ. Among all ways to pair the a’s with the b’s, the sum of products a₁b_σ(1) + … + aₙb_σ(n) is largest when the lists are paired in the same order (biggest with biggest) and smallest when paired in opposite order.

Why? If a < a′ and b < b′, then ab + a′b′ − (ab′ + a′b) = (a′ − a)(b′ − b) ≥ 0. So swapping any “wrongly ordered” pair never makes the sum smaller; keep swapping until everything is sorted.`,steps:["For (Σx)(Σ1/x): find the n positive numbers whose sum and reciprocal sum appear. Sometimes they are pairs like x + y.","For rearrangement: find two sequences that are ordered the same way (like a and a², or a and ln a).","The cyclic shift (b, c, a) is just one rearrangement of (a, b, c), so Σa·a ≥ Σa·b.","Trap: rearrangement compares the SAME numbers in different orders. Both sequences must be sorted the same way for the “same order is max” statement."],example:{q:"Prove a² + b² + c² ≥ ab + bc + ca for all real a, b, c.",a:"The sequence (a, b, c) is ordered the same way as itself. Pairing it with itself gives a·a + b·b + c·c; pairing it with the rearrangement (b, c, a) gives ab + bc + ca. Same order is the maximum, so a² + b² + c² ≥ ab + bc + ca."},de:[["Umordnungsungleichung","rearrangement inequality"],["gleich geordnet","similarly ordered"],["entgegengesetzt geordnet","oppositely ordered"],["Permutation","permutation"],["Tschebyschow-Ungleichung","Chebyshev’s inequality"]]},problems:[{type:"answer",q:`x, y, z are positive real numbers. Find the smallest possible value of

(x + y + z)·(1/(x + y) + 1/(y + z) + 1/(z + x)).`,answers:["9/2","4.5"],hints:["The denominators x + y, y + z, z + x are three positive numbers. What is their sum?","(x + y) + (y + z) + (z + x) = 2(x + y + z).","Use (u + v + w)(1/u + 1/v + 1/w) ≥ 9."],solution:`Let u = x + y, v = y + z, w = z + x. Then x + y + z = (u + v + w)/2, so the expression is ½(u + v + w)(1/u + 1/v + 1/w) ≥ ½·9 = 9/2.

Equality when u = v = w, i.e. x = y = z. So the smallest value is 9/2.`},{type:"answer",q:`The numbers 1, 2, 3, 4, 5 are arranged in some order as b₁, b₂, b₃, b₄, b₅.

Find the smallest possible value of 1·b₁ + 2·b₂ + 3·b₃ + 4·b₄ + 5·b₅.`,answers:["35"],hints:["Rearrangement: which order gives the minimum?","Opposite order: pair the biggest with the smallest.","b = (5, 4, 3, 2, 1)."],solution:"By the rearrangement inequality, the sum is smallest when the b’s are in the opposite order: 1·5 + 2·4 + 3·3 + 4·2 + 5·1 = 5 + 8 + 9 + 8 + 5 = 35."},{type:"proof",q:`Let a, b, c be positive real numbers. Prove that

a³ + b³ + c³ ≥ a²b + b²c + c²a.`,hints:["Write a³ as a²·a. Which two sequences are you pairing?","(a², b², c²) and (a, b, c) are ordered the same way.","a²b + b²c + c²a pairs (a², b², c²) with (b, c, a), a rearrangement of (a, b, c)."],keySteps:["For positive numbers, x ≤ y ⇔ x² ≤ y², so (a², b², c²) and (a, b, c) are similarly ordered.","a³ + b³ + c³ = a²·a + b²·b + c²·c is the same-order pairing.","a²b + b²c + c²a = a²·b + b²·c + c²·a pairs (a², b², c²) with (b, c, a), a permutation of (a, b, c).","By rearrangement, the same-order sum is the largest, which proves the claim."],solution:`Because a, b, c > 0, the map t ↦ t² is increasing, so the sequences (a², b², c²) and (a, b, c) are ordered the same way.

By the rearrangement inequality, pairing them in the same order gives the largest sum: a²·a + b²·b + c²·c. Any other pairing gives at most this much — in particular pairing (a², b², c²) with the permutation (b, c, a) of (a, b, c):
a²·b + b²·c + c²·a ≤ a³ + b³ + c³.`}],challenge:{source:"Classic",q:`Let a, b, c be positive real numbers. Prove that

aᵃ·bᵇ·cᶜ ≥ (abc)^((a + b + c)/3),

and determine when equality holds.`,keySteps:["Take logarithms (ln is increasing): equivalent to 3(a ln a + b ln b + c ln c) ≥ (a + b + c)(ln a + ln b + ln c).","The difference equals (a − b)(ln a − ln b) + (b − c)(ln b − ln c) + (c − a)(ln c − ln a).","ln is increasing, so x − y and ln x − ln y have the same sign: each product is ≥ 0.","Equality iff every product is 0, i.e. a = b = c (since ln is strictly increasing)."],solution:`Both sides are positive and ln is strictly increasing, so the inequality is equivalent to
a ln a + b ln b + c ln c ≥ (a + b + c)(ln a + ln b + ln c)/3,
i.e. 3(a ln a + b ln b + c ln c) − (a + b + c)(ln a + ln b + ln c) ≥ 0.

Multiply out: the left side is
2(a ln a + b ln b + c ln c) − (a ln b + a ln c + b ln a + b ln c + c ln a + c ln b)
= (a − b)(ln a − ln b) + (b − c)(ln b − ln c) + (c − a)(ln c − ln a).

Since ln is increasing, x − y and ln x − ln y always have the same sign, so each product is ≥ 0, and the inequality follows. (This is the rearrangement idea: (a, b, c) and (ln a, ln b, ln c) are similarly ordered.)

Equality: each product must be 0. Since ln is strictly increasing, (x − y)(ln x − ln y) = 0 only if x = y. So equality holds exactly when a = b = c.`}},70:{lesson:{idea:`The most basic inequality is t² ≥ 0. Almost every polynomial inequality can be proved by writing (left side) − (right side) as a sum of squares (SOS), maybe with positive factors in front.

Tools: completing the square (x² + px = (x + p/2)² − p²/4), the identity
a² + b² + c² − ab − bc − ca = ½[(a − b)² + (b − c)² + (c − a)²],
and factoring out a known root: if the inequality has equality at x = 1, then (x − 1)² is usually a factor of the difference.

The big advantage: SOS gives the equality case for free. A sum of squares is 0 exactly when every square is 0 — solve those equations at the same time.`,steps:["Move everything to one side: show D ≥ 0.","Guess the equality case (try x = y, x = 1, …). It tells you which squares to look for.","Complete squares one variable at a time, or factor out (x − x₀)² at a double root.","Equality: all squares = 0 simultaneously. Check those equations have a solution."],example:{q:"Prove x² + y² + 1 ≥ xy + x + y for all real x, y.",a:"Twice the difference is (x − y)² + (x − 1)² + (y − 1)² ≥ 0. Equality when x = y = 1."},de:[["Summe von Quadraten","sum of squares"],["quadratische Ergänzung","completing the square"],["nichtnegativ","non-negative"],["für alle reellen Zahlen","for all real numbers"],["Gleichheitsfall","equality case"]]},problems:[{type:"answer",q:`Find the minimum of

x² + 2xy + 2y² − 6x − 4y

over all real x, y.`,answers:["-10"],hints:["Complete the square in x first (treat y as a constant).","x² + 2xy − 6x = (x + y − 3)² − (y − 3)².","What is left is a quadratic in y alone."],solution:`Completing the square in x:
x² + 2x(y − 3) = (x + y − 3)² − (y − 3)².
So the expression is (x + y − 3)² − (y − 3)² + 2y² − 4y = (x + y − 3)² + y² + 2y − 9 = (x + y − 3)² + (y + 1)² − 10.

This is ≥ −10, with equality when y = −1 and x + y = 3, i.e. (x, y) = (4, −1). The minimum is −10.`},{type:"answer",q:`Real numbers a, b, c satisfy

a² + b² + c² + 14 = 2a + 4b + 6c.

Find a + b + c.`,answers:["6"],hints:["Bring everything to one side.","14 = 1 + 4 + 9.","(a − 1)² + (b − 2)² + (c − 3)² = 0."],solution:"Rearranged: (a² − 2a + 1) + (b² − 4b + 4) + (c² − 6c + 9) = 0, i.e. (a − 1)² + (b − 2)² + (c − 3)² = 0. A sum of squares is 0 only if each square is 0, so a = 1, b = 2, c = 3 and a + b + c = 6."},{type:"proof",q:"Prove that x⁴ − 4x + 3 ≥ 0 for every real x, and find when equality holds.",hints:["x = 1 gives 0. So x − 1 is a factor — twice, in fact.","Horner: x⁴ − 4x + 3 = (x − 1)(x³ + x² + x − 3), and x = 1 is again a root of the cubic.","x⁴ − 4x + 3 = (x − 1)²(x² + 2x + 3). Is the last factor positive?"],keySteps:["x = 1 is a root; dividing twice gives x⁴ − 4x + 3 = (x − 1)²(x² + 2x + 3).","x² + 2x + 3 = (x + 1)² + 2 > 0.","So the product of (x − 1)² ≥ 0 and a positive number is ≥ 0.","Equality iff (x − 1)² = 0, i.e. x = 1."],solution:`x = 1 is a root. Horner gives x⁴ − 4x + 3 = (x − 1)(x³ + x² + x − 3), and again x = 1 is a root of the cubic: x³ + x² + x − 3 = (x − 1)(x² + 2x + 3). So
x⁴ − 4x + 3 = (x − 1)²(x² + 2x + 3) = (x − 1)²·[(x + 1)² + 2].

The first factor is ≥ 0 and the second is ≥ 2 > 0, so the product is ≥ 0. It is 0 exactly when (x − 1)² = 0, i.e. x = 1.`}],challenge:{source:"Classic",q:`Prove that for all real numbers x and y

x² + xy + y² ≥ 3(x + y − 1),

and determine all cases of equality.`,keySteps:["Guess equality: by symmetry try x = y; x² + x² + x² = 3(2x − 1) gives (x − 1)² = 0, so x = y = 1.","Write the difference D = x² + xy + y² − 3x − 3y + 3 in terms of s = x + y and x − y: x² + xy + y² = ¾(x + y)² + ¼(x − y)².","D = ¾(x + y − 2)² + ¼(x − y)² ≥ 0 (check by expanding).","Equality iff x + y = 2 and x = y, i.e. x = y = 1."],solution:`Let D = x² + xy + y² − 3x − 3y + 3. We claim
D = ¾(x + y − 2)² + ¼(x − y)².
Check: ¾(x + y − 2)² = ¾x² + (3/2)xy + ¾y² − 3x − 3y + 3 and ¼(x − y)² = ¼x² − ½xy + ¼y². Adding gives x² + xy + y² − 3x − 3y + 3 = D. ✓

So D is a sum of non-negative terms and D ≥ 0, which is the inequality.

Equality holds exactly when both squares are 0: x + y = 2 and x = y, i.e. x = y = 1.`}},74:{lesson:{idea:`“Find the largest constant C such that … ≥ C·… for all x” is really TWO problems, and you need both for full marks:

1. Upper bound: plug in special values to show C cannot be bigger. One good choice of x gives C ≤ C₀.
2. Proof: show the inequality really holds for C = C₀ and all x.

Which values to plug in? The ones where the inequality is tightest — usually the equality case: symmetric points (a = b = c, x = y), x = 1, boundary values (a variable → 0), or the minimum of a ratio found with calculus in your rough work. Then the proof for C₀ is an ordinary inequality, and its equality case is exactly the point you plugged in. If they don’t match, something is wrong.`,steps:["Rewrite: C must be ≤ (left side)/(right side) for all allowed x, so C₀ = the minimum of that ratio.","Find the candidate point (symmetry, x = 1, or calculus in rough work). This gives C ≤ C₀.","Prove the inequality with C₀: AM–GM, SOS, Cauchy–Schwarz…","Write both halves. The classic mistake is giving only the proof (or only the example)."],example:{q:"Find the largest C with x² + 1 ≥ Cx for all x > 0.",a:"x = 1 gives 2 ≥ C, so C ≤ 2. And C = 2 works: x² + 1 − 2x = (x − 1)² ≥ 0. So C = 2."},de:[["bestmögliche Konstante","best possible constant"],["größte / kleinste Konstante","largest / smallest constant"],["einsetzen","substitute, plug in"],["scharf","sharp"]]},problems:[{type:"answer",q:`Find the largest real number C such that

x⁴ + 3 ≥ C·x

holds for all real x.`,answers:["4"],hints:["For x ≤ 0 any C ≥ 0 works. For x > 0 you need C ≤ (x⁴ + 3)/x.","Try x = 1.","Then check C = 4: x⁴ − 4x + 3 = (x − 1)²(x² + 2x + 3)."],solution:`x = 1 gives 4 ≥ C, so C ≤ 4.

C = 4 works: x⁴ − 4x + 3 = (x − 1)²(x² + 2x + 3) and x² + 2x + 3 = (x + 1)² + 2 > 0, so x⁴ + 3 ≥ 4x for all real x. The answer is 4.`},{type:"answer",q:`Find the largest real number C such that

(a + b)³ ≥ C·a²b

holds for all positive real numbers a and b.`,answers:["27/4","6.75"],hints:["The inequality is homogeneous: you can set b = 1.","AM–GM on a/2, a/2, b: their sum is a + b.","Equality in AM–GM: a/2 = b. Try a = 2, b = 1."],solution:`a = 2, b = 1: 27 ≥ 4C, so C ≤ 27/4.

C = 27/4 works: by AM–GM on a/2, a/2, b,
(a + b)/3 ≥ ∛(a/2·a/2·b) = ∛(a²b/4),
so (a + b)³ ≥ 27a²b/4. The answer is 27/4.`},{type:"proof",q:`Determine the largest real number C such that

x² + xy + y² ≥ C·(x + y)²

holds for all real x and y. Prove both that this C works and that no larger C does.`,hints:["Where is the inequality tightest? Try x = y.","x = y = 1 gives 3 ≥ 4C.","For C = ¾: write x² + xy + y² − ¾(x + y)² as a square."],keySteps:["x = y = 1: 3 ≥ 4C, so C ≤ ¾.","For C = ¾: x² + xy + y² − ¾(x + y)² = ¼(x − y)² ≥ 0.","So the inequality holds for C = ¾ and all x, y.","Answer C = ¾ (equality exactly when x = y)."],solution:`Upper bound: x = y = 1 gives 3 ≥ 4C, so C ≤ ¾.

C = ¾ works: x² + xy + y² − ¾(x² + 2xy + y²) = ¼x² − ½xy + ¼y² = ¼(x − y)² ≥ 0.

So the largest constant is C = ¾, and equality holds exactly when x = y.`}],challenge:{source:"Olympiad-style",q:`Determine the smallest real number C such that

1 + (x + y)² ≤ C·(1 + x²)(1 + y²)

holds for all real numbers x and y. For this C, find all cases of equality.`,keySteps:["Lower bound: try x = y = t; (1 + 4t²)/(1 + t²)² is largest at t² = ½, giving 4/3. So with x = y = 1/√2: 3 ≤ C·9/4, i.e. C ≥ 4/3.","For C = 4/3, need 4(1 + x²)(1 + y²) − 3 − 3(x + y)² ≥ 0.","Expanding: 1 + x² + y² + 4x²y² − 6xy = (x − y)² + (2xy − 1)² ≥ 0.","Equality iff x = y and 2xy = 1, i.e. x = y = 1/√2 or x = y = −1/√2. Answer C = 4/3."],solution:`Lower bound: x = y = 1/√2 gives 1 + (√2)² = 3 on the left and C·(3/2)² = 9C/4 on the right. So 3 ≤ 9C/4, i.e. C ≥ 4/3.

C = 4/3 works: we need 4(1 + x²)(1 + y²) ≥ 3 + 3(x + y)². The difference is
4 + 4x² + 4y² + 4x²y² − 3 − 3x² − 6xy − 3y² = 1 + x² + y² + 4x²y² − 6xy.
This equals (x − y)² + (2xy − 1)², since (x − y)² = x² − 2xy + y² and (2xy − 1)² = 4x²y² − 4xy + 1. So the difference is ≥ 0.

Hence the smallest constant is C = 4/3. Equality holds exactly when x = y and 2xy = 1, i.e. (x, y) = (1/√2, 1/√2) or (−1/√2, −1/√2).`}},78:{lesson:{idea:`If f is strictly increasing, then a < b ⇔ f(a) < f(b). So you may apply an increasing function to both sides of an inequality — take a root, a power, a logarithm — and the direction stays. A decreasing function flips it.

This gives three tricks:
1. Compare huge numbers: 2³⁰⁰ vs 3²⁰⁰? Take the 100th root: 8 vs 9.
2. Equations: a strictly increasing function takes each value at most once. Guess one solution; it is the only one.
3. Systems like f(x) = y, f(y) = z, f(z) = x with f increasing: if x > y then f(x) > f(y), so y > z, then z > x — a contradiction. So x = y = z.`,steps:["Check monotonicity: sums of increasing functions are increasing; x³, x⁵, √x, eˣ, ln x are increasing; 1/x is decreasing on x > 0.","Squaring is only safe when both sides are ≥ 0 — x² is increasing only for x ≥ 0. Classic trap.","For an equation: guess a solution, then argue “strictly increasing, so at most one solution”.","For comparisons: bring both sides to the same exponent or take logarithms."],example:{q:"Which is larger: 2³⁰⁰ or 3²⁰⁰?",a:"2³⁰⁰ = 8¹⁰⁰ and 3²⁰⁰ = 9¹⁰⁰. Since t ↦ t¹⁰⁰ is increasing for t > 0 and 8 < 9, we get 2³⁰⁰ < 3²⁰⁰."},de:[["streng monoton wachsend","strictly increasing"],["monoton fallend","decreasing"],["Logarithmus","logarithm"],["eindeutige Lösung","unique solution"],["Wurzel ziehen","take the root"]]},problems:[{type:"answer",q:`Solve for real x:

√(x − 1) + √(x + 4) = 5.`,answers:["5"],hints:["Is the left side increasing in x?","Both roots grow as x grows, so the left side is strictly increasing — at most one solution.","Look for x such that both roots are whole numbers that add up to 5."],solution:"For x ≥ 1 both √(x − 1) and √(x + 4) are strictly increasing, so their sum is strictly increasing and takes the value 5 at most once. x = 5 gives √4 + √9 = 2 + 3 = 5. So x = 5 is the only solution."},{type:"answer",q:`How many positive integers n satisfy

n¹⁰⁰ > 100ⁿ?`,answers:["98"],hints:["Take logarithms: 100·ln n > n·ln 100.","Divide by 100n: ln(n)/n > ln(100)/100.","f(x) = ln(x)/x increases up to x = e and decreases after. Which n beat f(100)?"],solution:`Taking ln (increasing): the condition is 100·ln n > n·ln 100, i.e. ln(n)/n > ln(100)/100.

f(x) = ln(x)/x has derivative (1 − ln x)/x², so it increases on (0, e] and decreases on [e, ∞). For 3 ≤ n < 100, f(n) > f(100). For n > 100, f(n) < f(100), and n = 100 gives equality. n = 2: 2¹⁰⁰ > 100² clearly; n = 1: 1 > 100 is false.

So n = 2, 3, …, 99: that is 98 numbers.`},{type:"proof",q:`Prove that for all real numbers a, b ≥ 0:

(a + b)/(1 + a + b) ≤ a/(1 + a) + b/(1 + b).`,hints:["Split the left fraction into two fractions with the same denominator.","(a + b)/(1 + a + b) = a/(1 + a + b) + b/(1 + a + b).","Compare a/(1 + a + b) with a/(1 + a): which denominator is bigger?"],keySteps:["Split: (a + b)/(1 + a + b) = a/(1 + a + b) + b/(1 + a + b).","1 + a + b ≥ 1 + a > 0 and a ≥ 0, so a/(1 + a + b) ≤ a/(1 + a).","Likewise b/(1 + a + b) ≤ b/(1 + b).","Add the two inequalities."],solution:`Write (a + b)/(1 + a + b) = a/(1 + a + b) + b/(1 + a + b).

Since b ≥ 0, 1 + a + b ≥ 1 + a > 0, and t ↦ 1/t is decreasing for t > 0, so 1/(1 + a + b) ≤ 1/(1 + a). Multiplying by a ≥ 0: a/(1 + a + b) ≤ a/(1 + a). In the same way b/(1 + a + b) ≤ b/(1 + b). Adding these gives the claim.`}],challenge:{source:"Classic",q:`Determine all triples (x, y, z) of real numbers with

3y = x³ + 2x,  3z = y³ + 2y,  3x = z³ + 2z.`,keySteps:["Let f(t) = (t³ + 2t)/3. The system says y = f(x), z = f(y), x = f(z), and f is strictly increasing (t³ and 2t are).","If x > y then f(x) > f(y), i.e. y > z; then f(y) > f(z), i.e. z > x. So x > y > z > x, contradiction. Same for x < y.","So x = y, and then z = f(y) = f(x) = y: all three are equal, with x = f(x).","x³ + 2x = 3x ⇔ x(x − 1)(x + 1) = 0. Solutions (0, 0, 0), (1, 1, 1), (−1, −1, −1); all check."],solution:`Let f(t) = (t³ + 2t)/3. The system reads y = f(x), z = f(y), x = f(z). Since t³ and 2t are strictly increasing, so is f.

Suppose x > y. Then f(x) > f(y), i.e. y > z. Then f(y) > f(z), i.e. z > x. So x > y > z > x, which is impossible. If x < y, all inequalities turn round and we get x < y < z < x, also impossible. Hence x = y, and then z = f(y) = f(x) = y. So x = y = z, and x = f(x):
x³ + 2x = 3x ⇔ x³ − x = 0 ⇔ x(x − 1)(x + 1) = 0.

The solutions are (0, 0, 0), (1, 1, 1) and (−1, −1, −1), and each of them satisfies all three equations.`}},82:{lesson:{idea:`For a sequence with aₙ₊₁ = p·aₙ + q (p ≠ 1), look for the fixed point L: the number with L = pL + q, so L = q/(1 − p). Subtract the two equations:
aₙ₊₁ − L = p·(aₙ − L).
So the distance to L is multiplied by p at every step — a geometric sequence. Hence
aₙ = L + pⁿ⁻¹·(a₁ − L).

Why this is useful: you get a closed formula instantly, and you see the behaviour: if |p| < 1 the sequence approaches L; if p > 1 it runs away from L. For p = 1 there is no fixed point: the sequence is arithmetic, aₙ = a₁ + (n − 1)q.`,steps:["Find L from L = pL + q.","bₙ = aₙ − L satisfies bₙ₊₁ = p·bₙ, so bₙ = pⁿ⁻¹·b₁.","Write aₙ = L + pⁿ⁻¹(a₁ − L). Check n = 1 and n = 2 — a common error is pⁿ instead of pⁿ⁻¹ when the sequence starts at a₁ (or a₀).","In a proof, state the formula and prove it by induction."],example:{q:"a₁ = 5 and aₙ₊₁ = 3aₙ − 4. Find a formula for aₙ.",a:"L = 3L − 4 gives L = 2. So aₙ − 2 = 3ⁿ⁻¹·(5 − 2) = 3ⁿ, and aₙ = 3ⁿ + 2. Check: a₁ = 5, a₂ = 11 = 3·5 − 4. ✓"},de:[["Rekursion, rekursive Folge","recursion, recursive sequence"],["Fixpunkt","fixed point"],["explizite Formel","closed formula"],["geometrische Folge","geometric sequence"],["Folgenglied","term of a sequence"]]},problems:[{type:"answer",q:`a₁ = 2 and aₙ₊₁ = 3aₙ − 2 for n ≥ 1.

Find a₁₀.`,answers:["19684"],hints:["Find the fixed point: L = 3L − 2.","L = 1, so aₙ − 1 is multiplied by 3 at each step.","aₙ − 1 = 3ⁿ⁻¹·(a₁ − 1) = 3ⁿ⁻¹."],solution:"L = 1, and aₙ − 1 = 3ⁿ⁻¹·(2 − 1) = 3ⁿ⁻¹. So a₁₀ = 3⁹ + 1 = 19683 + 1 = 19684."},{type:"answer",q:`a₁ = 1 and aₙ₊₁ = aₙ/2 + 3 for n ≥ 1.

Find the smallest n with aₙ > 5.99.`,answers:["10"],hints:["Fixed point: L = L/2 + 3.","L = 6, so 6 − aₙ halves at every step.","6 − aₙ = 5/2ⁿ⁻¹. When is that < 0.01?"],solution:"L = 6, and 6 − aₙ = (6 − 1)/2ⁿ⁻¹ = 5/2ⁿ⁻¹. We need 5/2ⁿ⁻¹ < 0.01, i.e. 2ⁿ⁻¹ > 500. Since 2⁸ = 256 and 2⁹ = 512, we need n − 1 ≥ 9, so n = 10. (a₁₀ = 6 − 5/512 ≈ 5.990, a₉ = 6 − 5/256 ≈ 5.980.)"},{type:"proof",q:`a₁ = 1 and aₙ₊₁ = 2aₙ + 3 for n ≥ 1.

Prove that aₙ = 2ⁿ⁺¹ − 3 for all n ≥ 1, and deduce that no term is divisible by 3.`,hints:["Use induction.","Base: 2² − 3 = 1. Step: put the formula into aₙ₊₁ = 2aₙ + 3.","For the second part: 2ⁿ⁺¹ − 3 ≡ 2ⁿ⁺¹ (mod 3)."],keySteps:["Base case: a₁ = 1 = 2² − 3.","Step: if aₙ = 2ⁿ⁺¹ − 3, then aₙ₊₁ = 2(2ⁿ⁺¹ − 3) + 3 = 2ⁿ⁺² − 3.","By induction the formula holds for all n ≥ 1.","aₙ ≡ 2ⁿ⁺¹ (mod 3), and a power of 2 is never divisible by 3. So 3 ∤ aₙ."],solution:`Induction on n. For n = 1: 2² − 3 = 1 = a₁. If aₙ = 2ⁿ⁺¹ − 3 for some n, then
aₙ₊₁ = 2aₙ + 3 = 2ⁿ⁺² − 6 + 3 = 2ⁿ⁺² − 3,
which is the formula for n + 1. So aₙ = 2ⁿ⁺¹ − 3 for all n ≥ 1.

(Where does the formula come from? The fixed point is L = −3, so aₙ + 3 doubles each step: aₙ + 3 = 2ⁿ⁻¹·4.)

Then aₙ ≡ 2ⁿ⁺¹ (mod 3). The only prime factor of 2ⁿ⁺¹ is 2, so 3 does not divide 2ⁿ⁺¹, and hence 3 does not divide aₙ.`}],challenge:{source:"Classic",q:`a₁ = 1 and aₙ₊₁ = 3aₙ + 1 for n ≥ 1.

Find a closed formula for aₙ and determine all n for which aₙ is divisible by 4.`,keySteps:["Fixed point L = −½, so aₙ + ½ = 3ⁿ⁻¹·(3/2), i.e. aₙ = (3ⁿ − 1)/2. Prove by induction: a₁ = 1, and 3·(3ⁿ − 1)/2 + 1 = (3ⁿ⁺¹ − 1)/2.","4 | aₙ ⇔ 8 | 3ⁿ − 1.","3² = 9 ≡ 1 (mod 8). n even: 3ⁿ ≡ 1, so 8 | 3ⁿ − 1. n odd: 3ⁿ ≡ 3, so 3ⁿ − 1 ≡ 2 (mod 8).","Answer: aₙ is divisible by 4 exactly when n is even."],solution:`Formula: the fixed point solves L = 3L + 1, so L = −½ and aₙ + ½ = 3ⁿ⁻¹(a₁ + ½) = 3ⁿ/2. So aₙ = (3ⁿ − 1)/2. Induction check: a₁ = (3 − 1)/2 = 1, and if aₙ = (3ⁿ − 1)/2 then aₙ₊₁ = 3(3ⁿ − 1)/2 + 1 = (3ⁿ⁺¹ − 1)/2.

Divisibility: aₙ is divisible by 4 exactly when 3ⁿ − 1 = 2aₙ is divisible by 8. Since 3² = 9 ≡ 1 (mod 8):
• n even, n = 2m: 3ⁿ = 9ᵐ ≡ 1 (mod 8), so 8 | 3ⁿ − 1.
• n odd, n = 2m + 1: 3ⁿ = 3·9ᵐ ≡ 3 (mod 8), so 3ⁿ − 1 ≡ 2 (mod 8) and 8 ∤ 3ⁿ − 1.

So 4 | aₙ exactly when n is even. (Check: a₂ = 4, a₃ = 13, a₄ = 40.)`}},85:{lesson:{idea:`The three sums you must know:
1 + 2 + … + n = n(n + 1)/2,
1² + 2² + … + n² = n(n + 1)(2n + 1)/6,
1³ + 2³ + … + n³ = (n(n + 1)/2)².

Where does the formula for squares come from? Telescoping: (k + 1)³ − k³ = 3k² + 3k + 1. Add this for k = 1, …, n: the left side collapses to (n + 1)³ − 1, and the right side is 3·Σk² + 3·n(n + 1)/2 + n. Solve for Σk².

Once you have (or are given) a formula, induction proves it: check n = 1, then show that adding the next term turns the formula for n into the formula for n + 1. Induction is also how to prove inequalities like “Σ ≤ f(n)” — and the trick there is often to prove a STRONGER statement, because a stronger hypothesis is easier to push forward.`,steps:["Base case: check n = 1 (or the first n in the statement).","Step: start from the sum up to n + 1, split off the last term, use the hypothesis for the rest.","Simplify until you see the formula for n + 1. Factor early: n(n + 1)(2n + 1)/6 + (n + 1)² = (n + 1)[n(2n + 1) + 6(n + 1)]/6.","If an inequality proof gets stuck (“≤ 2 + something”), strengthen the claim to something with a term that shrinks, like 2 − 1/n."],example:{q:"Compute 1² + 2² + … + 10².",a:"10·11·21/6 = 385."},de:[["vollständige Induktion","mathematical induction"],["Induktionsanfang","base case"],["Induktionsschritt","induction step"],["Summenformel","summation formula"],["Teleskopsumme","telescoping sum"]]},problems:[{type:"answer",q:"Compute 1³ + 2³ + 3³ + … + 20³.",answers:["44100"],hints:["Use the formula for the sum of cubes.","It is the square of 1 + 2 + … + 20.","1 + 2 + … + 20 = 210."],solution:"1³ + … + 20³ = (20·21/2)² = 210² = 44100."},{type:"answer",q:"Compute 1·2 + 2·3 + 3·4 + … + 20·21.",answers:["3080"],hints:["k(k + 1) = k² + k.","Use the formulas for Σk² and Σk with n = 20.","Σk² = 20·21·41/6 = 2870 and Σk = 210."],solution:`Σ k(k + 1) = Σk² + Σk = 20·21·41/6 + 20·21/2 = 2870 + 210 = 3080.

(In general 1·2 + … + n(n + 1) = n(n + 1)(n + 2)/3; here 20·21·22/3 = 3080.)`},{type:"proof",q:`Prove by induction that for every n ≥ 1

1³ + 2³ + … + n³ = (n(n + 1)/2)².`,hints:["Base case n = 1: 1 = 1².","Step: add (n + 1)³ to (n(n + 1)/2)².","Factor out (n + 1)²/4: you get (n + 1)²/4·(n² + 4n + 4)."],keySteps:["Base case: n = 1 gives 1 = (1·2/2)².","Hypothesis: 1³ + … + n³ = n²(n + 1)²/4.","Then 1³ + … + (n + 1)³ = n²(n + 1)²/4 + (n + 1)³ = (n + 1)²(n² + 4n + 4)/4 = (n + 1)²(n + 2)²/4.","This is the formula for n + 1; by induction it holds for all n ≥ 1."],solution:`For n = 1 both sides are 1.

Assume 1³ + … + n³ = n²(n + 1)²/4 for some n ≥ 1. Then
1³ + … + n³ + (n + 1)³ = n²(n + 1)²/4 + (n + 1)³ = (n + 1)²·(n² + 4(n + 1))/4 = (n + 1)²(n + 2)²/4 = ((n + 1)(n + 2)/2)²,
which is the formula for n + 1. By induction it holds for all n ≥ 1.`}],challenge:{source:"Classic",q:`Prove that for every positive integer n

1/1² + 1/2² + 1/3² + … + 1/n² ≤ 2 − 1/n,

and determine all n for which equality holds.`,keySteps:["Base case n = 1: 1 ≤ 2 − 1 = 1, with equality.","Step: if the sum up to n is ≤ 2 − 1/n, the sum up to n + 1 is ≤ 2 − 1/n + 1/(n + 1)².","It suffices that 1/(n + 1)² ≤ 1/n − 1/(n + 1) = 1/(n(n + 1)), which is true since n(n + 1) < (n + 1)²; in fact it is strict.","Hence the inequality holds for all n, with equality only for n = 1 (from n = 2 on the step adds a strict inequality)."],solution:`Let Sₙ = 1/1² + … + 1/n². We prove Sₙ ≤ 2 − 1/n by induction, and Sₙ < 2 − 1/n for n ≥ 2.

n = 1: S₁ = 1 = 2 − 1/1, equality.

Step: assume Sₙ ≤ 2 − 1/n. Then
Sₙ₊₁ = Sₙ + 1/(n + 1)² ≤ 2 − 1/n + 1/(n + 1)².
Since n(n + 1) < (n + 1)², we have 1/(n + 1)² < 1/(n(n + 1)) = 1/n − 1/(n + 1). Therefore
Sₙ₊₁ < 2 − 1/n + 1/n − 1/(n + 1) = 2 − 1/(n + 1).

So the inequality holds for all n, and for every n ≥ 2 it is strict. Equality holds only for n = 1.

(Note: trying to prove Sₙ ≤ 2 directly by induction fails — the hypothesis “≤ 2” leaves no room for the next term. The stronger statement is easier to prove.)`}},89:{lesson:{idea:`The Fibonacci numbers: F₁ = F₂ = 1 and Fₙ₊₁ = Fₙ + Fₙ₋₁, so 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, … (F₀ = 0 fits too). Useful facts, all provable by induction:
F₁ + F₂ + … + Fₙ = Fₙ₊₂ − 1,
F₁² + F₂² + … + Fₙ² = Fₙ·Fₙ₊₁,
consecutive Fibonacci numbers are coprime.

Modulo m the sequence is periodic, and it starts again at 0, 1. Reason: the pair (Fₙ mod m, Fₙ₊₁ mod m) decides everything that follows, and there are only m² possible pairs, so some pair repeats. The recursion also runs backwards (Fₙ₋₁ = Fₙ₊₁ − Fₙ), so the pair before is determined too — which means the very first pair (0, 1) comes back. Periods: 3 mod 2, 8 mod 3, 20 mod 5, 60 mod 10.`,steps:["For “last digit of F₂₀₂₆”: reduce the index by the period (60 for mod 10).","For parity or divisibility by small m: write the sequence mod m until 0, 1 appears again.","For sum identities: induction, using Fₙ₊₂ = Fₙ₊₁ + Fₙ in the step.","Watch the indexing: is it F₀ = 0 or F₁ = 1 first? Check with small cases."],example:{q:"Which Fibonacci numbers are even?",a:"Mod 2: 1, 1, 0, 1, 1, 0, … The pattern repeats with period 3, so Fₙ is even exactly when 3 | n (F₃ = 2, F₆ = 8, F₉ = 34, …)."},de:[["Fibonacci-Folge","Fibonacci sequence"],["periodisch, Periode","periodic, period"],["Rest modulo m","remainder mod m"],["Schubfachprinzip","pigeonhole principle"],["teilerfremd","coprime"]]},problems:[{type:"answer",q:"What is the last digit of F₂₀₂₆?",answers:["3"],hints:["Last digits of Fibonacci numbers repeat with period 60.","2026 = 33·60 + 46, so F₂₀₂₆ ends in the same digit as F₄₆.","Compute the sequence mod 10 up to index 46 (or use F₄₅, F₄₆ mod 10)."],solution:"Mod 10 the sequence has period 60, so F₂₀₂₆ ≡ F₄₆ (mod 10), since 2026 = 33·60 + 46. Computing mod 10 (or exactly, F₄₆ = 1836311903) gives last digit 3."},{type:"answer",q:"Compute F₁² + F₂² + … + F₁₀².",answers:["4895"],hints:["There is a neat formula: the sum of squares is a product of two Fibonacci numbers.","F₁² + … + Fₙ² = Fₙ·Fₙ₊₁. Check it for n = 2: 1 + 1 = 1·2.","F₁₀ = 55 and F₁₁ = 89."],solution:"F₁² + … + Fₙ² = FₙFₙ₊₁ (squares of sides of the Fibonacci rectangle). So the answer is F₁₀·F₁₁ = 55·89 = 4895. (Directly: 1 + 1 + 4 + 9 + 25 + 64 + 169 + 441 + 1156 + 3025 = 4895.)"},{type:"proof",q:"Prove that Fₙ is even if and only if n is divisible by 3.",hints:["Look at the sequence mod 2.","F₁, F₂, F₃ ≡ 1, 1, 0 (mod 2).","Show with induction that the pattern 1, 1, 0 repeats: the parity of Fₙ₊₃ equals the parity of Fₙ."],keySteps:["Fₙ₊₃ = Fₙ₊₂ + Fₙ₊₁ = 2Fₙ₊₁ + Fₙ, so Fₙ₊₃ ≡ Fₙ (mod 2).","So the parity of Fₙ only depends on n mod 3.","F₁ = 1, F₂ = 1 are odd and F₃ = 2 is even.","Hence Fₙ is even exactly when n ≡ 0 (mod 3)."],solution:`For every n ≥ 1,
Fₙ₊₃ = Fₙ₊₂ + Fₙ₊₁ = (Fₙ₊₁ + Fₙ) + Fₙ₊₁ = 2Fₙ₊₁ + Fₙ,
so Fₙ₊₃ and Fₙ have the same parity. Hence the parity of Fₙ depends only on the remainder of n mod 3 (by induction, Fₙ ≡ Fᵣ (mod 2) where r ∈ {1, 2, 3} and r ≡ n (mod 3)).

F₁ = 1 and F₂ = 1 are odd and F₃ = 2 is even. So Fₙ is even if and only if n ≡ 0 (mod 3).`}],challenge:{source:"Classic",q:"Prove that there is a Fibonacci number Fₙ with n ≥ 1 that is divisible by 2026.",keySteps:["Let m = 2026 and look at the pairs (Fₖ mod m, Fₖ₊₁ mod m) for k = 0, 1, …, m² (with F₀ = 0).","There are only m² possible pairs, so by pigeonhole two are equal: pair i = pair j with i < j.","Fₖ₋₁ = Fₖ₊₁ − Fₖ: equal pairs force equal previous pairs. Going back i steps, pair 0 = pair j − i.","Pair 0 is (0, 1), so F_(j − i) ≡ 0 (mod m) with j − i ≥ 1."],solution:`Let m = 2026 and F₀ = 0, so (F₀, F₁) = (0, 1). For k ≥ 0 let Pₖ = (Fₖ mod m, Fₖ₊₁ mod m).

There are only m² possible pairs of remainders, but m² + 1 pairs P₀, …, P_(m²). By the pigeonhole principle Pᵢ = Pⱼ for some 0 ≤ i < j.

If Pₖ = Pₗ with k, l ≥ 1, then also Pₖ₋₁ = Pₗ₋₁, because Fₖ₋₁ = Fₖ₊₁ − Fₖ ≡ Fₗ₊₁ − Fₗ = Fₗ₋₁ (mod m), and the second entries Fₖ ≡ Fₗ agree already. Applying this i times to Pᵢ = Pⱼ gives P₀ = P_(j − i).

So F_(j − i) ≡ F₀ = 0 (mod m), with j − i ≥ 1. Hence 2026 divides the Fibonacci number F_(j − i). (The same argument works for every m ≥ 1.)`}},93:{lesson:{idea:`Systems of non-linear equations look wild, but most competition systems give in to three moves:

1. Subtract two equations. For symmetric systems this produces a factor x − y: e.g. x² − y² + 2y − 2x = (x − y)(x + y − 2). Then split into cases: x = y, or the other factor is 0.
2. Multiply all equations, when each one is a product (xy = …, yz = …, zx = …). You get (xyz)², hence xyz up to sign, and then each variable by dividing.
3. Add all equations, to get the sum s = x + y + z; then each equation often gives one variable in terms of s.

Always check the solutions in the ORIGINAL system at the end.`,steps:["Look for symmetry: swapping x and y (or cycling x → y → z → x) leaves the system unchanged? Then subtract.","Factor out x − y. Never just divide by it: x = y is its own case.","Products on the left? Multiply everything; remember the square root gives ±.","Finish with a list of all solutions, checked in the original system."],example:{q:"Solve x² + 2y = 3, y² + 2x = 3 over the reals.",a:`Subtract: x² − y² − 2(x − y) = (x − y)(x + y − 2) = 0.
Case x = y: x² + 2x − 3 = 0, x = 1 or x = −3.
Case x + y = 2: x² + 2(2 − x) = 3 gives (x − 1)² = 0, so x = y = 1 again.
Solutions: (1, 1) and (−3, −3).`},de:[["Gleichungssystem","system of equations"],["subtrahieren / multiplizieren","subtract / multiply"],["Fallunterscheidung","case distinction"],["Probe","check (substituting back)"],["reelle Lösungen","real solutions"]]},problems:[{type:"answer",q:`x + y = 5, y + z = 7 and z + x = 8.

Find xyz.`,answers:["30"],hints:["Add all three equations.","2(x + y + z) = 20.","Subtract each equation from x + y + z = 10."],solution:"Adding: 2(x + y + z) = 20, so x + y + z = 10. Then z = 10 − 5 = 5, x = 10 − 7 = 3, y = 10 − 8 = 2, and xyz = 30."},{type:"answer",q:`Real numbers x, y, z satisfy

x(x + y + z) = 2,  y(x + y + z) = 3,  z(x + y + z) = 4.

Find the largest possible value of z.`,answers:["4/3"],hints:["Let s = x + y + z. Add the three equations.","s·s = 9, so s = 3 or s = −3.","z = 4/s."],solution:"Let s = x + y + z. Adding the equations: s² = 9, so s = ±3. Then x = 2/s, y = 3/s, z = 4/s, and indeed x + y + z = 9/s = s. So the solutions are (2/3, 1, 4/3) and (−2/3, −1, −4/3), and the largest possible z is 4/3."},{type:"proof",q:`Determine all pairs (x, y) of real numbers with

x³ = 2y − 1  and  y³ = 2x − 1.`,hints:["The system is symmetric. Subtract the equations.","x³ − y³ = −2(x − y), so (x − y)(x² + xy + y² + 2) = 0.","Can x² + xy + y² + 2 be 0?"],keySteps:["Subtract: x³ − y³ = 2(y − x), so (x − y)(x² + xy + y² + 2) = 0.","x² + xy + y² = (x + y/2)² + ¾y² ≥ 0, so the second factor is ≥ 2 > 0. Hence x = y.","Then x³ − 2x + 1 = 0, i.e. (x − 1)(x² + x − 1) = 0.","Solutions: x = y = 1, x = y = (−1 + √5)/2, x = y = (−1 − √5)/2; each satisfies both equations."],solution:`Subtracting the equations: x³ − y³ = 2y − 2x, i.e.
(x − y)(x² + xy + y²) + 2(x − y) = (x − y)(x² + xy + y² + 2) = 0.
Since x² + xy + y² = (x + y/2)² + ¾y² ≥ 0, the second factor is at least 2. So x = y.

Then x³ = 2x − 1, i.e. x³ − 2x + 1 = 0. x = 1 is a root, and x³ − 2x + 1 = (x − 1)(x² + x − 1). So x = 1 or x = (−1 ± √5)/2.

The solutions are (x, y) = (1, 1), ((−1 + √5)/2, (−1 + √5)/2) and ((−1 − √5)/2, (−1 − √5)/2). With x = y both equations are the same equation x³ = 2x − 1, so all three are indeed solutions.`}],challenge:{source:"Classic",q:`Determine all triples (x, y, z) of real numbers with

xy + x + y = 5,  yz + y + z = 11,  zx + z + x = 7.`,keySteps:["Add 1 to each equation and factor: (x + 1)(y + 1) = 6, (y + 1)(z + 1) = 12, (z + 1)(x + 1) = 8.","Let a = x + 1, b = y + 1, c = z + 1. Multiplying: (abc)² = 576, so abc = 24 or abc = −24.","abc = 24: c = 24/6 = 4, a = 24/12 = 2, b = 24/8 = 3, so (x, y, z) = (1, 2, 3). abc = −24: a = −2, b = −3, c = −4, so (x, y, z) = (−3, −4, −5).","Both triples satisfy the original system."],solution:`Adding 1 to each equation lets us factor:
(x + 1)(y + 1) = 6,  (y + 1)(z + 1) = 12,  (z + 1)(x + 1) = 8.
Put a = x + 1, b = y + 1, c = z + 1. Then ab = 6, bc = 12, ca = 8. None of a, b, c is 0. Multiplying the three equations: (abc)² = 576, so abc = 24 or abc = −24.

If abc = 24: c = abc/(ab) = 4, a = abc/(bc) = 2, b = abc/(ca) = 3. So (x, y, z) = (1, 2, 3).
If abc = −24: c = −4, a = −2, b = −3. So (x, y, z) = (−3, −4, −5).

Check: 1·2 + 1 + 2 = 5, 2·3 + 2 + 3 = 11, 3·1 + 3 + 1 = 7 ✓, and 12 − 7 = 5, 20 − 9 = 11, 15 − 8 = 7 ✓. The solutions are (1, 2, 3) and (−3, −4, −5).`}},97:{lesson:{idea:`Many GWF inequalities come with a side condition, like a + b + c = 1 or abc = 1. Two ways to use it:

1. Homogenize. With a + b + c = 1 you may replace any 1 by a + b + c, so that all terms get the same degree. Example: 1/a − 1 = (1 − a)/a = (b + c)/a. Now AM–GM or SOS work cleanly. With abc = 1 you can multiply a term by ∛(abc) or abc to fix degrees.

2. Substitute. With abc = 1, x = 1/a, y = 1/b, z = 1/c also has xyz = 1, and sometimes the inequality becomes much nicer in x, y, z. The condition also gives free facts: abc = 1 ⇒ a + b + c ≥ 3 (AM–GM); a + b + c = 1 ⇒ ab + bc + ca ≤ 1/3.

The equality case is almost always the symmetric point: a = b = c = 1/3 or a = b = c = 1. Use it to guide every step: each AM–GM you use must be an equality there.`,steps:["Guess equality (usually all variables equal under the condition).","Rewrite with the condition: replace 1 by a + b + c, or use abc = 1 to simplify fractions.","Apply AM–GM / Cauchy–Schwarz / SOS so that each step is tight at the equality case.","State the equality case and check it satisfies the condition."],example:{q:"a + b + c = 1. Prove ab + bc + ca ≤ 1/3.",a:"1 = (a + b + c)² = a² + b² + c² + 2(ab + bc + ca) ≥ 3(ab + bc + ca), since a² + b² + c² ≥ ab + bc + ca. Equality when a = b = c = 1/3."},de:[["Nebenbedingung","side condition, constraint"],["homogenisieren","homogenize"],["Gleichheit gilt genau dann, wenn …","equality holds if and only if …"],["positive reelle Zahlen","positive real numbers"]]},problems:[{type:"answer",q:`a, b, c are positive real numbers with abc = 1.

Find the smallest possible value of a + 2b + 4c.`,answers:["6"],hints:["AM–GM on the three terms a, 2b, 4c.","Their product is 8abc = 8.","Equality when a = 2b = 4c. Is that possible with abc = 1?"],solution:`AM–GM: a + 2b + 4c ≥ 3·∛(a·2b·4c) = 3·∛8 = 6.

Equality when a = 2b = 4c: a = 2, b = 1, c = 1/2 gives abc = 1 and a + 2b + 4c = 2 + 2 + 2 = 6. The minimum is 6.`},{type:"answer",q:`a, b, c are positive real numbers with a + b + c = 1.

Find the smallest possible value of (1 + 1/a)(1 + 1/b)(1 + 1/c).`,answers:["64"],hints:["Guess: a = b = c = 1/3 gives 4·4·4.","Homogenize: 1 + 1/a = (a + 1)/a = (2a + b + c)/a.","AM–GM on the four terms a, a, b, c: 2a + b + c ≥ 4·⁴√(a²bc)."],solution:`1 + 1/a = (a + (a + b + c))/a = (a + a + b + c)/a ≥ 4·⁴√(a²bc)/a, and similarly for b and c. Multiplying:
(1 + 1/a)(1 + 1/b)(1 + 1/c) ≥ 64·⁴√(a⁴b⁴c⁴)/(abc) = 64.

Equality when a = b = c = 1/3, which gives 4³ = 64. The minimum is 64.`},{type:"proof",q:`Let a, b, c be positive real numbers with a + b + c = 1. Prove that

(1/a − 1)(1/b − 1)(1/c − 1) ≥ 8,

and find when equality holds.`,hints:["Replace 1 by a + b + c.","1/a − 1 = (1 − a)/a = (b + c)/a.","b + c ≥ 2√(bc). Multiply the three inequalities."],keySteps:["Use the condition: 1/a − 1 = (b + c)/a, and similarly for b and c.","AM–GM: b + c ≥ 2√(bc), c + a ≥ 2√(ca), a + b ≥ 2√(ab).","Product ≥ 8√(a²b²c²)/(abc) = 8.","Equality iff a = b = c, i.e. a = b = c = 1/3."],solution:`Since a + b + c = 1, we have 1/a − 1 = (1 − a)/a = (b + c)/a, and likewise for b and c. So the product is
(b + c)(c + a)(a + b)/(abc).
By AM–GM, b + c ≥ 2√(bc), c + a ≥ 2√(ca), a + b ≥ 2√(ab); all are positive, so multiplying gives (a + b)(b + c)(c + a) ≥ 8abc. Hence the product is ≥ 8.

Equality requires equality in all three AM–GMs: a = b = c, and with a + b + c = 1 that means a = b = c = 1/3. Then each factor is 2 and the product is 8.`}],challenge:{source:"IMO 1995",q:`Let a, b, c be positive real numbers with abc = 1. Prove that

1/(a³(b + c)) + 1/(b³(c + a)) + 1/(c³(a + b)) ≥ 3/2,

and determine when equality holds.`,keySteps:["Substitute x = 1/a, y = 1/b, z = 1/c (positive, xyz = 1).","1/(a³(b + c)) = x³/(1/y + 1/z) = x³yz/(y + z) = x²/(y + z), using xyz = 1.","Engel form: Σ x²/(y + z) ≥ (x + y + z)²/(2(x + y + z)) = (x + y + z)/2.","AM–GM: x + y + z ≥ 3·∛(xyz) = 3, so the sum is ≥ 3/2. Equality iff x = y = z = 1, i.e. a = b = c = 1."],solution:`Let x = 1/a, y = 1/b, z = 1/c. These are positive and xyz = 1. Then
1/(a³(b + c)) = x³/(1/y + 1/z) = x³·yz/(y + z) = x²·(xyz)/(y + z) = x²/(y + z),
and similarly for the other two terms. So we must show
x²/(y + z) + y²/(z + x) + z²/(x + y) ≥ 3/2.

By the Engel form of Cauchy–Schwarz,
x²/(y + z) + y²/(z + x) + z²/(x + y) ≥ (x + y + z)²/(2(x + y + z)) = (x + y + z)/2.
By AM–GM, x + y + z ≥ 3·∛(xyz) = 3. Hence the sum is at least 3/2.

Equality: the AM–GM step needs x = y = z, so x = y = z = 1 (as xyz = 1); then Engel is also an equality, since x/(y + z) = y/(z + x) = z/(x + y). So equality holds exactly when a = b = c = 1, where each term is 1/2.`}}};export{e as default};
