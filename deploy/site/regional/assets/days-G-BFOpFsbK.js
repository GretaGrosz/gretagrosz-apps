const e={40:{lesson:{idea:`Tangent-chord angle: the angle between a tangent at A and a chord AB equals the inscribed angle on AB from the other side of the chord. If C is on the circle on the other side of AB, then ∠(tangent, AB) = ∠ACB.

Why: the tangent is perpendicular to the radius OA. Triangle OAB is isosceles, so ∠OAB = 90° − ½∠AOB, and the tangent angle is 90° − ∠OAB = ½∠AOB, which is exactly the inscribed angle.

When to use it: whenever a tangent touches a circle at a point that is also the end of a chord. Think of the tangent as a “chord of length zero”: the tangent angle behaves like an inscribed angle. Trap: the equal inscribed angle is on the OTHER side of the chord from the angle you measure.`,steps:["Mark the touching point A and the chord AB.","Pick the angle between the tangent and AB on one side.","It equals ∠ACB for any C on the arc on the other side of AB.","Then chase angles as usual (angle sums, isosceles triangles)."],example:{q:"A chord AB has central angle ∠AOB = 100°. What angle does the tangent at A make with AB?",a:"Half the central angle: 50°. (Check: ∠OAB = 40° and the tangent is perpendicular to OA, so 90° − 40° = 50°.)"},de:[["Sehnen-Tangentenwinkelsatz","tangent-chord angle theorem"],["Tangente","tangent"],["Sehne","chord"],["Berührpunkt","point of tangency"]]},problems:[{type:"answer",q:`In triangle ABC, ∠ABC = 70° and ∠ACB = 50°. The tangent to the circumcircle at A meets the line BC at T.

Find ∠ATB in degrees.`,answers:["20"],hints:["First decide where T lies: beyond B or beyond C?","The angle between the tangent TA and the chord AB equals the inscribed angle at C.","∠TAB = ∠ACB = 50° and ∠ABT = 180° − 70°."],solution:"Since ∠B > ∠C, T lies on the ray CB beyond B. By the tangent-chord angle, ∠TAB = ∠ACB = 50°. The angle ∠ABT is the outer angle at B: 180° − 70° = 110°. So in triangle TAB, ∠ATB = 180° − 50° − 110° = 20°. (In general it is ∠B − ∠C.)"},{type:"answer",q:`From a point P outside a circle, the two tangents touch the circle at A and B, and ∠APB = 40°. C is a point on the larger arc AB (the arc further from P).

Find ∠ACB in degrees.`,answers:["70"],hints:["The two tangents from P have equal length.","Triangle PAB is isosceles. Find ∠PAB.","Then use the tangent-chord angle at A for the chord AB."],solution:"PA = PB, so ∠PAB = (180° − 40°)/2 = 70°. This is the angle between the tangent PA and the chord AB. C lies on the other side of AB from P, so ∠ACB = ∠PAB = 70°."},{type:"proof",q:`Let ABC be a triangle and t the tangent to its circumcircle at A. A line parallel to t meets the side AB at D and the side AC at E.

Prove that B, C, E, D lie on one circle.`,hints:["Find ∠ADE in two steps.","DE ∥ t gives alternate angles at D and at A.","The angle between t and AB equals ∠ACB."],keySteps:["Let X be a point of t on the other side of AB from C. Tangent-chord: ∠XAB = ∠ACB.","DE ∥ AX and X, E lie on opposite sides of AB, so ∠ADE = ∠XAD = ∠XAB (alternate angles).","Hence ∠ADE = ∠ACB = ∠ECB.","So ∠BDE = 180° − ∠ADE = 180° − ∠ECB: opposite angles of BCED add to 180°, so it is cyclic."],solution:`Let X be a point on t on the other side of line AB from C. By the tangent-chord angle, ∠XAB = ∠ACB.

The lines DE and AX are parallel, and AD is a transversal with X and E on opposite sides of it. So the alternate angles are equal: ∠ADE = ∠XAD = ∠XAB = ∠ACB.

In the quadrilateral BCED the angle at D is ∠BDE = 180° − ∠ADE = 180° − ∠ACB, and the angle at C is ∠ECB = ∠ACB. They add up to 180°, so BCED is a cyclic quadrilateral.`}],challenge:{source:"Classic",q:`Two circles meet at the points P and Q. A line through P meets the first circle again at A and the second circle again at B, so that P lies between A and B. The tangent to the first circle at A and the tangent to the second circle at B meet at C.

Prove that A, Q, B, C lie on one circle.`,keySteps:["Tangent-chord in the first circle (chord AP): ∠CAB = ∠CAP = ∠AQP.","Tangent-chord in the second circle (chord BP): ∠CBA = ∠CBP = ∠BQP.","P lies between A and B, so ∠AQB = ∠AQP + ∠PQB = ∠CAB + ∠CBA.","Angle sum in ABC: ∠ACB = 180° − ∠AQB; C and Q lie on opposite sides of AB, so AQBC is cyclic."],solution:`In the first circle, AC is the tangent at A and AP is a chord. Q lies on this circle on the other side of AP from C, so by the tangent-chord angle ∠CAP = ∠AQP. Since P is on segment AB, ∠CAB = ∠CAP = ∠AQP.

In the same way, in the second circle ∠CBA = ∠CBP = ∠BQP.

P lies on segment AB, so the ray QP lies inside the angle AQB and ∠AQB = ∠AQP + ∠PQB = ∠CAB + ∠CBA.

In triangle ABC, ∠ACB = 180° − ∠CAB − ∠CBA = 180° − ∠AQB. The points C and Q lie on opposite sides of AB, so in the quadrilateral AQBC opposite angles add up to 180°. Hence A, Q, B, C lie on one circle.`}},44:{lesson:{idea:`Four points lie on one circle (a cyclic quadrilateral, Sehnenviereck) exactly when one of these holds:

1. Opposite angles add up to 180°.
2. An outer angle equals the opposite inner angle.
3. A side is seen from the two other points under the same angle: ∠ABD = ∠ACD with B, C on the SAME side of AD (converse of the inscribed angle theorem).

Why 3 is true: draw the circle through A, D, B. If C were inside it, ∠ACD would be bigger than ∠ABD; outside, smaller. So C must be on it.

This is the most important tool of olympiad geometry: you prove that four points are concyclic, and then you get many new equal angles for free. Trap: in criterion 3 the two points must be on the same side; on opposite sides you need the angles to add to 180° instead.`,steps:["Look for two equal angles that “look at” the same segment from the same side.","Or for two opposite angles that add up to 180° (two right angles is the classic case).","Conclude the four points are concyclic.","Use the circle: all other inscribed angles on the same chords are now equal."],example:{q:"In a convex quadrilateral ABCD, ∠ABD = ∠ACD = 30° and ∠BAC = 40°. Find ∠BDC.",a:"B and C are on the same side of AD and see AD under 30°, so ABCD is cyclic. Then ∠BDC and ∠BAC both stand on the chord BC: ∠BDC = 40°."},de:[["Sehnenviereck","cyclic quadrilateral"],["Umkehrung des Peripheriewinkelsatzes","converse of the inscribed angle theorem"],["Peripheriewinkel","inscribed angle"],["auf einem Kreis liegen (konzyklisch)","concyclic"]]},problems:[{type:"answer",q:`ABCD is a cyclic quadrilateral (vertices in this order) with ∠BAC = 30°, ∠CAD = 45° and ∠ABD = 50°.

Find ∠ADC in degrees.`,answers:["85"],hints:["Move each given angle to another vertex along the circle.","∠DBC = ∠DAC because both stand on chord DC.","∠ABC = ∠ABD + ∠DBC = 50° + 45°."],solution:`∠DBC = ∠DAC = 45° (same chord DC). So ∠ABC = 50° + 45° = 95°, and opposite angles of a cyclic quadrilateral add to 180°: ∠ADC = 180° − 95° = 85°.

Check another way: ∠ADB = ∠ACB = 180° − 30° − 95° = 55° and ∠BDC = ∠BAC = 30°, total 85°.`},{type:"answer",q:`In a convex quadrilateral ABCD, ∠ABD = ∠ACD = 40°, ∠ADB = 60° and ∠BAC = 50°.

Find ∠ABC in degrees.`,answers:["70"],hints:["Two of the given angles look at the same side.","B and C see AD under the same angle, from the same side.","So ABCD is cyclic and ∠BDC = ∠BAC."],solution:"∠ABD = ∠ACD and B, C lie on the same side of AD, so ABCD is cyclic. Then ∠BDC = ∠BAC = 50°, so ∠ADC = 60° + 50° = 110° and ∠ABC = 180° − 110° = 70°."},{type:"proof",q:`ABCD is a square with centre O. P is a point outside the square, on the other side of AB from O, with ∠APB = 90°.

Prove that PO bisects the angle APB.`,hints:["What is ∠AOB in a square?","∠APB and ∠AOB are both 90°, and P, O are on opposite sides of AB.","So A, P, B, O are concyclic. Which inscribed angle equals ∠APO?"],keySteps:["The diagonals of a square are perpendicular, so ∠AOB = 90°.","∠APB + ∠AOB = 180° and P, O lie on opposite sides of AB, so APBO is cyclic.","∠APO = ∠ABO (both on chord AO, P and B on the same arc).","∠ABO = 45° (diagonal of a square), so ∠APO = 45° = ½∠APB."],solution:`The diagonals of a square are perpendicular, so ∠AOB = 90°. Hence ∠APB + ∠AOB = 180°, and since P and O lie on opposite sides of AB, the quadrilateral APBO is cyclic.

In this circle, ∠APO and ∠ABO are inscribed angles on the chord AO, and P, B lie on the same arc AO. So ∠APO = ∠ABO = 45°, because the diagonal BD bisects the right angle at B.

Then ∠OPB = 90° − 45° = 45° = ∠APO, so PO bisects ∠APB.`}],challenge:{source:"Classic (Miquel’s theorem)",q:"Points D, E, F lie on the sides BC, CA, AB of triangle ABC. Prove that the circumcircles of the triangles AEF, BFD and CDE pass through one common point.",keySteps:["Let M be the second intersection of the circles AEF and BFD (if they touch at F, take M = F).","AFME cyclic: ∠FME = 180° − ∠A. BDMF cyclic: ∠DMF = 180° − ∠B.","Angles around M: ∠DME = 360° − (180° − ∠A) − (180° − ∠B) = ∠A + ∠B = 180° − ∠C.","So ∠DME + ∠DCE = 180°, hence CDME is cyclic and M is on the third circle."],solution:`Let M be the second common point of the circles AEF and BFD. We draw the case where M lies inside the triangle; the other positions work the same way with the angles rearranged.

AFME is cyclic, so ∠FME = 180° − ∠FAE = 180° − ∠A. BDMF is cyclic, so ∠DMF = 180° − ∠B.

The three angles around M add up to 360°:
∠DME = 360° − (180° − ∠A) − (180° − ∠B) = ∠A + ∠B = 180° − ∠C.

So in the quadrilateral CDME, ∠DME + ∠DCE = 180°: it is cyclic. Hence M also lies on the circle through C, D, E, and all three circles pass through M.`}},48:{lesson:{idea:`Angle chasing (Winkeljagd) means: name a few basic angles (usually α, β, γ of the triangle) and express every other angle in them. The trick that makes hard problems easy is to find hidden cyclic quadrilaterals.

Where they hide in a triangle:
• Two right angles on the same segment: the feet of two altitudes E, F lie on the circle with diameter BC (Thales). So B, C, E, F are concyclic, and so are A, F, H, E.
• Two equal angles on the same segment.
• Special angle values: if ∠A = 60°, then ∠BOC = ∠BHC = ∠BIC = 120°, so B, C, O, H, I are concyclic.

Why this matters: once you have a circle you can “move” an angle to a far-away vertex. Trap: write each angle in α, β, γ and check with a quick drawing, otherwise it is easy to confuse 90° − α with α.`,steps:["Write all three angles as α, β, γ and mark right angles.","Look for pairs of right angles on one segment (Thales circles).","Use the circle to move angles: inscribed angles on the same chord are equal.","Finish with an angle sum in a triangle."],example:{q:"In triangle ABC, E and F are the feet of the altitudes from B and C. Show ∠AEF = ∠ABC.",a:"∠BEC = ∠BFC = 90°, so B, C, E, F lie on the circle with diameter BC. In the cyclic quadrilateral BCEF the outer angle at E equals the opposite inner angle: ∠AEF = ∠FBC = ∠ABC."},de:[["Winkeljagd","angle chasing"],["Thaleskreis","Thales circle"],["Hilfskreis","auxiliary circle"],["Außenwinkel","exterior angle"]]},problems:[{type:"answer",q:`In triangle ABC, ∠BAC = 40° and ∠ABC = 60°. D is the foot of the altitude from A and E the foot of the altitude from B.

Find ∠DEB in degrees.`,answers:["30"],hints:["Which four points lie on one circle?","∠ADB = ∠AEB = 90°, so A, B, D, E lie on the circle with diameter AB.","Then ∠DEB = ∠DAB."],solution:"∠ADB = ∠AEB = 90°, so A, B, D, E lie on the circle with diameter AB. D and E are on the same side of AB, so ∠DEB = ∠DAB. In the right triangle ABD, ∠DAB = 90° − 60° = 30°. So ∠DEB = 30°."},{type:"answer",q:`In triangle ABC, ∠A = 70°, ∠B = 60° and ∠C = 50°. E and F are the feet of the altitudes from B and C, and M is the midpoint of BC.

Find ∠EMF in degrees.`,answers:["40"],hints:["E and F see BC under a right angle.","So E and F lie on the circle with diameter BC. Where is its centre?","M is the centre, so ∠EMF is a central angle: twice ∠ECF."],solution:"E and F lie on the circle with diameter BC, whose centre is M. ∠ECF is an inscribed angle on the chord EF, and in the right triangle AFC, ∠ACF = 90° − 70° = 20°. The central angle is twice the inscribed angle: ∠EMF = 40°."},{type:"proof",q:`ABC is an acute triangle with ∠BAC = 60°. O is the circumcentre, H the orthocentre and I the incentre.

Prove that B, C, O, H, I lie on one circle.`,hints:["Compute ∠BOC, ∠BHC and ∠BIC in terms of ∠A.","They are 2α, 180° − α and 90° + α/2.","With α = 60° all three are 120°. Which side of BC are O, H, I on?"],keySteps:["∠BOC = 2∠A = 120° (central angle).","∠BHC = 180° − ∠A = 120°.","∠BIC = 90° + ∠A/2 = 120°.","The triangle is acute, so O, H, I all lie inside it, on the same side of BC; equal angles on BC from the same side ⇒ all on one circle through B and C."],solution:`Central angle: ∠BOC = 2·∠BAC = 120°. Orthocentre: ∠BHC = 180° − ∠BAC = 120°. Incentre: ∠BIC = 180° − (β + γ)/2 = 90° + α/2 = 120°.

The triangle is acute, so O and H lie inside it; I always does. So O, H, I all lie on the same side of BC as A, and each sees the segment BC under 120°. By the converse of the inscribed angle theorem they all lie on one circle through B and C.`}],challenge:{source:"Classic (Brahmagupta’s theorem)",q:`ABCD is a cyclic quadrilateral whose diagonals AC and BD are perpendicular and meet at P. The line through P perpendicular to AB meets AB at E and CD at M.

Prove that M is the midpoint of CD.`,keySteps:["Vertical angles: ∠MPD = ∠EPB = 90° − ∠ABD (right triangle PEB).","Inscribed angles: ∠ABD = ∠ACD.","In the right triangle PCD: ∠PDC = 90° − ∠ACD = ∠MPD, so MP = MD.","In the same way ∠MPC = ∠EPA = 90° − ∠BAC = 90° − ∠BDC = ∠PCD, so MP = MC. Hence MC = MD."],solution:`Triangle APB has a right angle at P, so E lies on segment AB, and the ray PM is opposite to PE, just as PD is opposite to PB.

Vertical angles give ∠MPD = ∠EPB. In the right triangle PEB, ∠EPB = 90° − ∠EBP = 90° − ∠ABD. Inscribed angles on chord AD give ∠ABD = ∠ACD. In the right triangle PCD, ∠PDC = 90° − ∠PCD = 90° − ∠ACD. So ∠MPD = ∠MDP and triangle MPD is isosceles: MP = MD.

In the same way ∠MPC = ∠EPA = 90° − ∠BAC, and ∠BAC = ∠BDC, so ∠MPC = 90° − ∠BDC = ∠PCD. Triangle MPC is isosceles: MP = MC.

Hence MC = MD, and since M lies on CD, it is the midpoint.`}},52:{lesson:{idea:`Let D, E, F be the feet of the altitudes from A, B, C (Höhenfußpunkte) and H the orthocentre. DEF is the orthic triangle (Höhenfußpunktdreieck). Facts for an acute triangle:

• Six cyclic quadrilaterals: BCEF, CAFD, ABDE (Thales on a side) and AFHE, BDHF, CEHD (two right angles).
• ∠AEF = ∠ABC and ∠AFE = ∠ACB, so triangle AEF is similar to ABC.
• The angles of DEF are 180° − 2α, 180° − 2β, 180° − 2γ, and H is the incentre of DEF.
• The reflection of H in BC lies on the circumcircle (same for the other sides).

Why the last one: the reflection H′ has ∠BH′C = ∠BHC = 180° − α, and it lies on the other side of BC from A, so ABH′C is cyclic. Useful consequence: HD = DH′, so the circumcircle “sees” H.`,steps:["Draw all three feet and mark the six right angles.","Pick the cyclic quadrilateral that contains the angle you need.","Remember ∠BHC = 180° − α and ∠HBC = ∠HAC = 90° − γ.","To bring H onto the circumcircle, reflect it in a side."],example:{q:"In an acute triangle with ∠A = 70°, find the angle of the orthic triangle at D.",a:"∠EDF = 180° − 2·70° = 40°."},de:[["Höhenfußpunkt","foot of an altitude"],["Höhenfußpunktdreieck","orthic triangle"],["Spiegelung an einer Seite","reflection in a side"],["Höhenschnittpunkt","orthocentre"]]},problems:[{type:"answer",q:`Triangle ABC has angles ∠A = 50°, ∠B = 60°, ∠C = 70°. D, E, F are the feet of the altitudes from A, B, C.

Find the largest angle of triangle DEF in degrees.`,answers:["80"],hints:["Find ∠AEF and ∠CED first.","BCEF is cyclic, so ∠AEF = ∠B. Similarly ∠CED = ∠B.","So ∠DEF = 180° − 2∠B; do the same at D and F."],solution:"BCEF is cyclic (circle with diameter BC), so ∠AEF = ∠ABC = β. In the same way ABDE is cyclic and ∠CED = β. Hence ∠DEF = 180° − 2β = 60°. Similarly ∠EDF = 180° − 2α = 80° and ∠DFE = 180° − 2γ = 40°. The largest is 80°."},{type:"answer",q:`In an acute triangle ABC, D is the foot of the altitude from A, and BD = 4, DC = 6, AD = 8. H is the orthocentre.

Find HD.`,answers:["3"],hints:["H lies on AD. Look for two similar right triangles with D as the right-angle vertex.","∠HBD = 90° − γ = ∠DAC.","So triangles BDH and ADC are similar."],solution:`BH is perpendicular to AC, so ∠HBD = 90° − γ, and in the right triangle ADC also ∠DAC = 90° − γ. The right triangles BDH and ADC are similar, so HD/BD = DC/AD, and HD = 4·6/8 = 3.

(Equivalently: the reflection H′ of H in BC lies on the circumcircle, and DH′·DA = DB·DC.)`},{type:"proof",q:`ABC is an acute triangle with orthocentre H. H′ is the reflection of H in the line BC.

Prove that H′ lies on the circumcircle of ABC.`,hints:["A reflection keeps angles.","∠BH′C = ∠BHC. What is ∠BHC?","∠BHC = 180° − ∠A, and H′ is on the other side of BC from A."],keySteps:["Reflection in BC maps triangle BHC to BH′C, so ∠BH′C = ∠BHC.","∠BHC = 180° − ∠BAC (quadrilateral with the two feet of the altitudes).","H is inside the triangle, so H′ lies on the other side of BC from A.","∠BAC + ∠BH′C = 180° with A, H′ on opposite sides ⇒ ABH′C is cyclic."],solution:`The reflection in BC maps B and C to themselves and H to H′, so triangles BHC and BH′C are congruent and ∠BH′C = ∠BHC.

Let E, F be the feet of the altitudes from B and C. In the quadrilateral AFHE the angles at E and F are 90°, so ∠FHE = 180° − ∠A, and ∠BHC is its vertical angle. Hence ∠BH′C = 180° − ∠A.

The triangle is acute, so H is inside it, on the same side of BC as A; therefore H′ is on the other side. In the quadrilateral ABH′C the opposite angles at A and H′ add up to 180°, so it is cyclic: H′ lies on the circumcircle.`}],challenge:{source:"Classic",q:`ABC is an acute triangle with orthocentre H, and D, E, F are the feet of the altitudes from A, B, C.

Prove that H is the incentre of triangle DEF, and that A is the centre of the excircle of DEF opposite D.`,keySteps:["BDHF is cyclic (right angles at D, F): ∠HDF = ∠HBF = ∠EBA = 90° − α.","CDHE is cyclic: ∠HDE = ∠HCE = ∠FCA = 90° − α. So DA (= DH) bisects ∠EDF.","The same at E and F, so H is the intersection of the three internal bisectors: the incentre.","BC ⊥ DA, so BC is the external bisector at D; likewise CA at E and AB at F. A = AB ∩ AC lies on the external bisectors at E and F (and on DA), so A is the excentre opposite D."],solution:`In the quadrilateral BDHF the angles at D and F are right angles, so it is cyclic (circle with diameter BH). Hence ∠HDF = ∠HBF. In the right triangle ABE, ∠HBF = ∠EBA = 90° − α. So ∠HDF = 90° − α.

In the same way CDHE is cyclic and ∠HDE = ∠HCE = ∠FCA = 90° − α. So ∠HDF = ∠HDE: the line DH, which is the line DA, bisects the angle EDF. (The triangle is acute, so all these points are in the positions of the usual drawing.)

By the same argument EH bisects ∠DEF and FH bisects ∠DFE. So H is the common point of the internal bisectors of DEF: its incentre.

The external bisector at a vertex is perpendicular to the internal one. BC ⊥ AD, so BC is the external bisector of DEF at D; likewise CA is the external bisector at E and AB the external bisector at F. The point A lies on the external bisectors at E and F (it is on CA and AB) and on the internal bisector at D (the line DA). That point is exactly the excentre of DEF opposite D.`}},56:{lesson:{idea:`Angle bisector theorem (Winkelsymmetralensatz): if the bisector of ∠A meets BC at D, then

BD : DC = AB : AC.

So BD = a·c/(b + c) and DC = a·b/(b + c) (with a = BC, b = CA, c = AB).

Why: triangles ABD and ACD have the same height from A, so their areas are in the ratio BD : DC. But D is equally far from AB and AC (it lies on the bisector), so the same areas are also in the ratio AB : AC.

The external bisector at A cuts the line BC outside the segment in the same ratio. Useful consequence for the incentre I: AI : ID = (b + c) : a. Trap: the ratio uses the two sides NEXT to the angle, not the opposite one.`,steps:["See an angle bisector? Write BD/DC = AB/AC at once.","Solve for BD with BD + DC = a.","For the incentre, use the theorem twice (once from A, once from B in triangle ABD).","Combine with similar triangles or areas if needed."],example:{q:"AB = 6, AC = 4, BC = 5. The bisector from A meets BC at D. Find BD and DC.",a:"BD : DC = 6 : 4 = 3 : 2 and BD + DC = 5, so BD = 3 and DC = 2."},de:[["Winkelsymmetralensatz (Winkelhalbierendensatz)","angle bisector theorem"],["Teilverhältnis","ratio of division"],["Außenwinkelsymmetrale","external angle bisector"],["Strahlensatz","intercept theorem"]]},problems:[{type:"answer",q:`Triangle ABC has AB = 7, AC = 5 and BC = 8. The bisector of ∠A meets BC at D.

Find BD.`,answers:["14/3"],hints:["Which ratio does D divide BC in?","BD : DC = AB : AC = 7 : 5.","BD = 8 · 7/12."],solution:"BD : DC = 7 : 5 and BD + DC = 8, so BD = 8·7/12 = 14/3."},{type:"answer",q:`Triangle ABC has BC = 14, CA = 15, AB = 13. I is the incentre and the line AI meets BC at D.

Find the ratio AI : ID (give AI/ID as a number).`,answers:["2"],hints:["First find BD with the bisector theorem from A.","BI bisects the angle ABD of triangle ABD.","Bisector theorem in triangle ABD: AI : ID = AB : BD."],solution:"From A: BD = 14·13/(13 + 15) = 6.5. In triangle ABD, BI bisects ∠ABD, so AI : ID = AB : BD = 13 : 6.5 = 2. (In general AI : ID = (b + c) : a = 28 : 14.)"},{type:"proof",q:`Prove the angle bisector theorem: if the bisector of ∠BAC in triangle ABC meets BC at D, then BD/DC = AB/AC.

Use a parallel line, not areas.`,hints:["Draw the line through C parallel to AD.","Let it meet the line BA at E. Look at the angles of triangle ACE.","Triangle ACE is isosceles; then use the intercept theorem from B."],keySteps:["The parallel to AD through C meets line BA at E, beyond A.","∠AEC = ∠BAD (corresponding angles) and ∠ACE = ∠DAC (alternate angles).","∠BAD = ∠DAC, so ∠AEC = ∠ACE and AE = AC.","Intercept theorem (AD ∥ EC, lines from B): BD/DC = BA/AE = AB/AC."],solution:`Draw the line through C parallel to AD; it meets the line BA at a point E beyond A.

Corresponding angles (transversal BE): ∠AEC = ∠BAD. Alternate angles (transversal AC): ∠ACE = ∠DAC. Since AD is the bisector, ∠BAD = ∠DAC, so ∠AEC = ∠ACE and triangle ACE is isosceles: AE = AC.

The lines AD and EC are parallel and cut the two rays from B, so by the intercept theorem BD/DC = BA/AE = AB/AC.`}],challenge:{source:"Classic",q:`In triangle ABC the bisector of ∠A meets BC at D. Prove that

AD² = AB·AC − BD·DC.`,keySteps:["Extend AD to meet the circumcircle again at E.","Triangles ABD and AEC are similar (∠BAD = ∠EAC, ∠ABC = ∠AEC): AB·AC = AD·AE.","Triangles ABD and CED are similar (vertical angles at D, ∠BAE = ∠BCE): AD·DE = BD·DC.","AB·AC = AD·(AD + DE) = AD² + BD·DC."],solution:`Let the line AD meet the circumcircle again at E (on the arc BC not containing A).

Triangles ABD and AEC: ∠BAD = ∠EAC (bisector) and ∠ABD = ∠ABC = ∠AEC (both on chord AC). So they are similar and AB/AE = AD/AC, i.e. AB·AC = AD·AE.

Triangles ABD and CED: ∠ADB = ∠CDE (vertical angles) and ∠BAD = ∠BAE = ∠BCE = ∠DCE (both on chord BE). So they are similar and AD/CD = BD/ED, i.e. AD·DE = BD·DC.

Therefore AB·AC = AD·AE = AD·(AD + DE) = AD² + AD·DE = AD² + BD·DC, which is the claim.`}},60:{lesson:{idea:`The excircle opposite A (Ankreis) touches the side BC and the extensions of AB and AC beyond B and C. Its centre I_a (Ankreismittelpunkt) is where the internal bisector of ∠A meets the external bisectors at B and C.

Tangent lengths (s = half the perimeter):
• From A to the excircle: exactly s.
• From B: s − c; from C: s − b.
• Compare the incircle: from B it is s − b, from C it is s − c.

So on BC the incircle and the excircle touch at points symmetric about the midpoint of BC. Why AT = s: the two tangents from A are equal, and together they cover AB + BC + CA (because the tangents from B and from C split BC). Area formula: area = r_a·(s − a). Trap: s − b and s − c swap places between the incircle and the excircle.`,steps:["Mark the three touching points of the excircle and the equal tangent lengths.","Use AT = s, then BT = s − c and CU = s − b.","Remember: the internal bisector at B is perpendicular to the external one, so ∠IBI_a = 90°.","For radii use area = r·s = r_a·(s − a)."],example:{q:"Find the radius of the excircle opposite the hypotenuse of the 3-4-5 triangle.",a:"Area 6, s = 6, s − a = 1, so r_a = 6/1 = 6."},de:[["Ankreis","excircle"],["Ankreismittelpunkt","excentre"],["Tangentenabschnitt","tangent length"],["halber Umfang","semiperimeter"]]},problems:[{type:"answer",q:`Triangle ABC has BC = 5, CA = 6, AB = 7. The excircle opposite A touches the line AB at T (beyond B).

Find AT.`,answers:["9"],hints:["The two tangents from A to the excircle are equal.","Together they cover the whole perimeter.","AT = s."],solution:"Let the excircle touch BC at X and AC at U. Then BT = BX, CU = CX and AT = AU. So AT + AU = AB + BX + AC + XC = 7 + 6 + 5 = 18, and AT = 9 = s."},{type:"answer",q:`Triangle ABC has BC = 14, CA = 15, AB = 13.

Find the radius of the excircle opposite A (the one touching BC).`,answers:["12"],hints:["Use area = r_a·(s − a).","s = 21 and the area is 84.","s − a = 21 − 14 = 7."],solution:"s = 21 and the area is 84 (Heron). So r_a = 84/(s − a) = 84/7 = 12."},{type:"proof",q:`The excircle of triangle ABC opposite A touches the line AB at T. Let s be half the perimeter.

Prove that AT = s and BT = s − c, where c = AB.`,hints:["Name all three touching points: X on BC, T on AB, U on AC.","Use “equal tangents” from A, from B and from C.","AT + AU = (AB + BT) + (AC + CU)."],keySteps:["Let the excircle touch BC at X and line AC at U.","Equal tangents: BT = BX, CU = CX, AT = AU.","AT + AU = AB + BX + AC + XC = AB + AC + BC = 2s, so AT = s.","BT = AT − AB = s − c."],solution:`Let the excircle touch BC at X and the extension of AC at U. Tangent segments from one point are equal, so BT = BX, CU = CX and AT = AU.

T is beyond B, so AT = AB + BT = AB + BX, and AU = AC + CU = AC + CX. Adding: AT + AU = AB + AC + BX + XC = AB + AC + BC = 2s. As AT = AU, AT = s.

Finally BT = AT − AB = s − c.`}],challenge:{source:"Classic",q:`Triangle ABC has incircle radius r, excircle opposite A with radius r_a, side lengths a = BC, b = CA, c = AB and half-perimeter s.

Prove that r·r_a = (s − b)(s − c).`,keySteps:["Incircle touches BC at D with BD = s − b; excircle touches BC at X with BX = s − c.","BI and BI_a are the internal and external bisectors at B, so ∠IBD = β/2 and ∠I_aBX = 90° − β/2.","In the right triangle BXI_a: ∠BI_aX = β/2. So the right triangles IDB and BXI_a are similar.","ID/DB = BX/XI_a, i.e. r/(s − b) = (s − c)/r_a."],solution:`Let the incircle touch BC at D and the excircle opposite A touch BC at X. From the tangent lengths, BD = s − b and BX = s − c; also ID = r, I_aX = r_a, and both radii are perpendicular to BC.

BI bisects the angle B, so ∠IBD = β/2. BI_a bisects the outer angle at B, which is 180° − β, so ∠I_aBX = 90° − β/2. In the right triangle BXI_a, ∠BI_aX = 90° − (90° − β/2) = β/2.

So the right triangles IDB (right angle at D) and BXI_a (right angle at X) have the equal angles ∠IBD = ∠BI_aX = β/2 and are similar. Hence
ID/DB = BX/XI_a, i.e. r/(s − b) = (s − c)/r_a,
and r·r_a = (s − b)(s − c).`}},64:{lesson:{idea:`South pole theorem (Südpolsatz): the bisector of ∠A and the perpendicular bisector of BC meet on the circumcircle, at the midpoint M of the arc BC not containing A (the “south pole”). The midpoint N of the other arc BC (the “north pole”) lies on the external bisector at A, and MN is a diameter.

Trillium (Satz vom Dreizack, incentre–excentre lemma): MB = MC = MI = MI_a. So M is the centre of the circle through B, C, I and the excentre I_a.

Why MB = MI: ∠MBI = ∠MBC + ∠CBI = ∠MAC + β/2 = α/2 + β/2, and ∠MIB is the outer angle of triangle ABI, also α/2 + β/2. So triangle MBI is isosceles.

When to use: the incentre appears together with the circumcircle. Trap: M is on the arc NOT containing A.`,steps:["Extend AI to meet the circumcircle at M.","Write down MB = MC = MI (and = MI_a).","Use ∠MBC = ∠MCB = α/2.","Triangles MBD and MAB are similar (D = AI ∩ BC): MB² = MD·MA."],example:{q:"In triangle ABC with ∠BAC = 70°, AI meets the circumcircle at M. Find ∠MBC.",a:"∠MBC = ∠MAC = 35° (same chord MC)."},de:[["Südpolsatz","south pole theorem"],["Südpol / Nordpol","midpoint of arc BC (not containing / containing A)"],["Satz vom Dreizack","trillium theorem (incentre–excentre lemma)"],["Bogenmittelpunkt","arc midpoint"]]},problems:[{type:"answer",q:`Triangle ABC has circumradius 5 and ∠BAC = 60°. I is the incentre and the line AI meets the circumcircle again at M.

Find MI.`,answers:["5"],hints:["Trillium: MI equals another, easier length.","MI = MB. Find the central angle ∠BOM.","∠BAM = 30°, so ∠BOM = 60°."],solution:"By the trillium theorem MI = MB. The inscribed angle ∠BAM = 30°, so the central angle ∠BOM = 60°. Triangle BOM is isosceles with a 60° angle, so it is equilateral and MB = 5. So MI = 5."},{type:"answer",q:`In triangle ABC, the bisector of ∠A meets BC at D and the circumcircle again at M. MD = 4 and MA = 9. I is the incentre.

Find AI.`,answers:["3"],hints:["Find MB first, then use MB = MI.","Triangles MBD and MAB are similar.","∠MBD = ∠MBC = ∠MAC = ∠MAB, and the angle at M is shared."],solution:"∠MBD = ∠MBC = ∠MAC = ∠MAB, and ∠BMD = ∠AMB, so triangles MBD and MAB are similar: MB/MA = MD/MB, i.e. MB² = 4·9 = 36, MB = 6. By the trillium theorem MI = MB = 6, so AI = MA − MI = 9 − 6 = 3."},{type:"proof",q:`I is the incentre of triangle ABC, and the line AI meets the circumcircle again at M.

Prove that MB = MC = MI.`,hints:["MB = MC: which inscribed angles stand on MB and MC?","For MI = MB, compute ∠MBI and ∠MIB.","∠MIB is an outer angle of triangle ABI."],keySteps:["∠BAM = ∠MAC, so the chords MB and MC are equal: MB = MC.","∠MBI = ∠MBC + ∠CBI = ∠MAC + β/2 = α/2 + β/2.","∠MIB = ∠IAB + ∠IBA = α/2 + β/2 (outer angle of triangle ABI).","So triangle MBI is isosceles: MB = MI."],solution:`AM bisects ∠BAC, so the inscribed angles ∠BAM and ∠MAC are equal; equal inscribed angles stand on equal chords, so MB = MC.

M lies on the arc BC not containing A, so ∠MBC = ∠MAC = α/2 (same chord MC). Hence ∠MBI = ∠MBC + ∠CBI = α/2 + β/2.

I lies on segment AM, so ∠MIB is the outer angle at I of triangle ABI: ∠MIB = ∠IAB + ∠IBA = α/2 + β/2.

So ∠MBI = ∠MIB and MB = MI.`}],challenge:{source:"Classic",q:`Triangle ABC has circumradius R, inradius r and incentre I. The line AI meets the circumcircle again at M.

Prove that AI·IM = 2Rr.`,keySteps:["Let N be the other end of the diameter through M (the north pole), and F the touching point of the incircle on AB.","∠MBN = 90° (Thales) and ∠MNB = ∠MAB = α/2 (A and N on the same arc MB).","The right triangles AFI and NBM are similar: IF/AI = MB/MN, i.e. r/AI = MB/(2R).","Trillium MB = MI gives AI·IM = 2Rr."],solution:`Let MN be the diameter through M, so MN = 2R, and let F be the point where the incircle touches AB, so IF = r and IF ⊥ AB.

By Thales ∠MBN = 90°. The inscribed angles ∠MNB and ∠MAB stand on the chord MB, and A and N lie on the same side of the chord MB (the short arc from B to M contains neither of them), so ∠MNB = ∠MAB = α/2.

The right triangles AFI (right angle at F, ∠FAI = α/2) and NBM (right angle at B, ∠BNM = α/2) are similar. So IF/AI = MB/MN, that is r/AI = MB/(2R), or AI·MB = 2Rr.

By the trillium theorem MB = MI, so AI·IM = 2Rr.

(Remark: with the power of a point, AI·IM = R² − OI², which gives Euler’s formula OI² = R² − 2Rr.)`}},68:{lesson:{idea:`Extended law of sines (erweiterter Sinussatz): in every triangle

a/sin α = b/sin β = c/sin γ = 2R,

where R is the circumradius. Combined with area = ½·bc·sin α it gives R = abc/(4·Area).

Why: draw the diameter BA′ through B. Triangle BCA′ has a right angle at C (Thales), and ∠BA′C is either α (A′ on the same arc as A) or 180° − α; both have the same sine. So a = BA′·sin α = 2R·sin α.

When to use: you know a side and its opposite angle and want R, or you want to compare circumradii of different triangles. R = abc/(4A) is the quickest way to R from three sides. Trap: in a triangle with an angle of 150° the sine is ½, not something negative.`,steps:["Side and opposite angle known? R = a/(2 sin α).","Three sides known? Find the area (Heron), then R = abc/(4·Area).","Two triangles sharing a side, with supplementary or equal opposite angles, have equal circumradii.","Convert lengths to angles: a = 2R sin α."],example:{q:"Find the circumradius of the triangle with sides 5, 5, 6.",a:"The height to the side 6 is 4, so the area is 12. R = 5·5·6/(4·12) = 150/48 = 25/8."},de:[["erweiterter Sinussatz","extended law of sines"],["Umkreisradius","circumradius"],["Flächeninhalt","area"],["Heronsche Formel","Heron’s formula"]]},problems:[{type:"answer",q:`A triangle has sides 13, 14 and 15.

Find its circumradius.`,answers:["65/8","8.125"],hints:["Use R = abc/(4·Area).","Heron: s = 21.","The area is √(21·8·7·6) = 84."],solution:"The area is 84, so R = 13·14·15/(4·84) = 2730/336 = 65/8."},{type:"answer",q:`In triangle ABC, AB = 10 and ∠ACB = 150°.

Find the circumradius.`,answers:["10"],hints:["Use the extended law of sines on the side AB.","AB = 2R·sin ∠ACB.","sin 150° = ½."],solution:"AB = 2R·sin 150° = 2R·½ = R, so R = 10."},{type:"proof",q:"Prove that in every triangle ABC with circumradius R, a = 2R·sin α (where a = BC and α = ∠BAC), and deduce that the area equals abc/(4R).",hints:["Draw the diameter through B and call its other end A′.","Triangle BCA′ has a right angle at C. What is ∠BA′C?","It is α or 180° − α; the sine is the same."],keySteps:["Let BA′ be a diameter. If A′ = C, then α = 90° and a = 2R ✓.","Otherwise ∠BCA′ = 90° (Thales), so BC = BA′·sin ∠BA′C.","∠BA′C = α (same arc as A) or 180° − α (other arc): either way sin ∠BA′C = sin α, so a = 2R sin α.","Area = ½·bc·sin α = ½·bc·a/(2R) = abc/(4R)."],solution:`Let O be the circumcentre and A′ the point with BA′ a diameter, so BA′ = 2R.

If A′ = C, then BC is a diameter, α = 90° and a = 2R = 2R sin α.

Otherwise, by Thales ∠BCA′ = 90°, and in the right triangle BCA′: BC = BA′·sin ∠BA′C. If A′ lies on the same arc BC as A, then ∠BA′C = α (inscribed angles on BC); if it lies on the other arc, then ABA′C is cyclic with A, A′ opposite, so ∠BA′C = 180° − α. Since sin(180° − α) = sin α, in both cases a = 2R sin α.

For the area: Area = ½·b·c·sin α = ½·b·c·a/(2R) = abc/(4R).`}],challenge:{source:"Classic",q:`ABC is an acute triangle with circumradius R and orthocentre H.

(a) Prove that the triangles BHC, CHA and AHB all have circumradius R.
(b) Prove that AH = 2R·cos α, where α = ∠BAC.`,keySteps:["∠BHC = 180° − α (feet of the altitudes), so sin ∠BHC = sin α.","Extended sine law in BHC: its circumradius is BC/(2 sin ∠BHC) = a/(2 sin α) = R. Same for CHA and AHB.","In triangle AHB (circumradius R): AH = 2R·sin ∠ABH.","∠ABH = 90° − α (right triangle ABE, E the foot from B), so AH = 2R sin(90° − α) = 2R cos α."],solution:`(a) Let E, F be the feet of the altitudes from B and C. In the quadrilateral AFHE the angles at E and F are 90°, so ∠BHC = ∠FHE = 180° − α. By the extended law of sines in triangle BHC, its circumradius is
BC/(2 sin ∠BHC) = a/(2 sin(180° − α)) = a/(2 sin α) = R.
In the same way ∠CHA = 180° − β and ∠AHB = 180° − γ, so CHA and AHB also have circumradius R.

(b) In triangle AHB the side AH is opposite the angle ∠ABH. By (a) its circumradius is R, so AH = 2R·sin ∠ABH. In the right triangle ABE (E the foot of the altitude from B on AC), ∠ABE = 90° − α, and ∠ABH = ∠ABE. So AH = 2R·sin(90° − α) = 2R cos α.`}},72:{lesson:{idea:`Three rules cover almost every area problem:

1. Same height ⇒ areas are in the ratio of the bases. Two triangles with a common vertex and bases on one line: [ABD] : [ADC] = BD : DC.
2. Similar triangles with ratio k ⇒ areas in the ratio k².
3. Common angle: [AB′C′] : [ABC] = (AB′·AC′) : (AB·AC) for B′ on AB and C′ on AC (because area = ½·xy·sin of the angle).

Why rule 1: area = ½·base·height and the height is the same.

When to use: points that divide sides in given ratios, cevians, trapezoids, “find the area of the shaded part”. Areas also turn into length ratios: if two triangles share a base, the area ratio is the ratio of their heights. Trap: rule 2 squares the ratio, rule 1 does not.`,steps:["Find two triangles with the same height (same vertex, bases on one line).","Write their area ratio as a ratio of bases.","Go step by step from the whole triangle to the small piece.","For parallel lines use similar triangles and square the ratio."],example:{q:"Triangle ABC has area 45. A line parallel to BC cuts AB at P with AP : PB = 2 : 1 and AC at Q. Find [APQ].",a:"APQ is similar to ABC with ratio 2/3, so [APQ] = (2/3)²·45 = 20."},de:[["Flächenverhältnis","area ratio"],["ähnliche Dreiecke","similar triangles"],["Ähnlichkeitsfaktor","scale factor"],["Grundlinie und Höhe","base and height"]]},problems:[{type:"answer",q:`Triangle ABC has area 60. D is on BC with BD : DC = 1 : 2, and E is on AC with AE : EC = 3 : 1.

Find the area of triangle ADE.`,answers:["30"],hints:["Go from ABC to ADC to ADE.","[ADC] : [ABC] = DC : BC.","[ADE] : [ADC] = AE : AC."],solution:"[ADC] = (2/3)·60 = 40 (same height from A). [ADE] = (3/4)·40 = 30 (same height from D)."},{type:"answer",q:`ABCD is a trapezoid with AB ∥ CD, AB = 6 and CD = 3. The diagonals meet at P, and triangle PCD has area 4.

Find the area of the trapezoid.`,answers:["36"],hints:["Triangles PAB and PCD are similar. With which ratio?","Ratio 2, so [PAB] = 4·4 = 16.","[PAD] : [PCD] = PA : PC = 2."],solution:"PAB and PCD are similar with ratio AB : CD = 2, so PA : PC = 2 and [PAB] = 4·[PCD] = 16. Triangles PAD and PCD have the same height from D, so [PAD] = 2·4 = 8; in the same way [PBC] = 8. Total: 16 + 4 + 8 + 8 = 36."},{type:"proof",q:`The diagonals of a convex quadrilateral ABCD meet at P.

Prove that [PAB]·[PCD] = [PBC]·[PDA], where [XYZ] is the area of triangle XYZ.`,hints:["Compare triangles with the same height.","PAB and PBC have the same height from B.","PDA and PCD have the same height from D."],keySteps:["[PAB]/[PBC] = PA/PC (same height from B, bases on AC).","[PDA]/[PCD] = PA/PC (same height from D).","So [PAB]/[PBC] = [PDA]/[PCD].","Cross-multiplying gives the claim."],solution:`Triangles PAB and PBC have their bases PA and PC on the line AC and the same vertex B, so they have the same height: [PAB]/[PBC] = PA/PC.

In the same way, with vertex D: [PDA]/[PCD] = PA/PC.

So [PAB]/[PBC] = [PDA]/[PCD], and multiplying out gives [PAB]·[PCD] = [PBC]·[PDA].`}],challenge:{source:"Classic",q:`D, E, F lie on the sides BC, CA, AB of triangle ABC with BD = BC/3, CE = CA/3 and AF = AB/3. The segments AD, BE and CF bound a small triangle in the middle.

Prove that its area is 1/7 of the area of ABC.`,keySteps:["Let P = AD ∩ BE, Q = BE ∩ CF, R = CF ∩ AD. The segments AP, BQ, CR cut ABC into PQR and the triangles ABP, BCQ, CAR.","Parallel to BE through D meets CA at X: CX/CE = CD/CB = 2/3, so EX = CA/9, while AE = 2CA/3.","Intercept theorem in triangle ADX: AP : PD = AE : EX = 6 : 1.","[ABP] = (6/7)·[ABD] = (6/7)·(1/3)·[ABC] = (2/7)[ABC]; the same for BCQ and CAR, so [PQR] = (1 − 6/7)[ABC] = [ABC]/7."],solution:`Let P = AD ∩ BE, Q = BE ∩ CF and R = CF ∩ AD. Going along each segment, the order is A, R, P, D on AD, B, P, Q, E on BE and C, Q, R, F on CF, so the segments AP, BQ, CR cut ABC into the middle triangle PQR and the three triangles ABP, BCQ, CAR.

AP : PD. Draw the line through D parallel to BE; it meets CA at X. In triangle CBE, by the intercept theorem CX/CE = CD/CB = 2/3, so EX = CE/3 = CA/9. Also AE = CA − CE = 2CA/3. In triangle ADX the line BE meets AD at P and AX at E and is parallel to DX, so AP : PD = AE : EX = (2/3) : (1/9) = 6 : 1.

Areas. [ABD] = (1/3)[ABC] (same height from A, BD = BC/3), and [ABP] = (AP/AD)·[ABD] = (6/7)(1/3)[ABC] = (2/7)[ABC].

The whole configuration is unchanged when we rename A → B → C → A (then D → E → F and P → Q → R), so also [BCQ] = [CAR] = (2/7)[ABC]. Therefore
[PQR] = [ABC] − 3·(2/7)[ABC] = (1/7)[ABC].`}},76:{lesson:{idea:`A tangential quadrilateral (Tangentenviereck) has an incircle touching all four sides. Pitot’s theorem: then the sums of opposite sides are equal,

AB + CD = BC + DA.

Why: the two tangents from each vertex are equal. Call them a, b, c, d (from A, B, C, D). Then AB + CD = (a + b) + (c + d) and BC + DA = (b + c) + (d + a). The converse is also true for convex quadrilaterals: if AB + CD = BC + DA, there is an incircle.

More facts: the area is r·s (s = half the perimeter), and the centre I lies on all four angle bisectors, so ∠AIB + ∠CID = 180°. When to use: a circle touches four sides, or a problem gives sums of sides. Trap: a cyclic quadrilateral has angle sums 180°, a tangential one has SIDE sums equal. Do not mix them up.`,steps:["Mark the four touching points and the equal tangent lengths.","Use AB + CD = BC + DA.","For the area use r·s; for the radius of a trapezoid use the height (= 2r).","For angles: I is on all four angle bisectors."],example:{q:"A tangential quadrilateral has AB = 5, BC = 7, CD = 9. Find DA.",a:"AB + CD = BC + DA, so 14 = 7 + DA and DA = 7."},de:[["Tangentenviereck","tangential quadrilateral"],["Satz von Pitot","Pitot’s theorem"],["Inkreis","incircle"],["Umkehrung","converse"]]},problems:[{type:"answer",q:`An isosceles trapezoid with parallel sides 8 and 2 has an incircle.

Find the radius of the incircle.`,answers:["2"],hints:["Pitot gives the length of the legs.","Legs: 2·leg = 8 + 2, so each leg is 5.","The height is the diameter of the incircle."],solution:"Pitot: 2·leg = 8 + 2, so each leg is 5. The horizontal overhang on each side is (8 − 2)/2 = 3, so the height is √(25 − 9) = 4. The incircle touches both parallel sides, so its diameter is the height: r = 2."},{type:"answer",q:`A tangential quadrilateral has perimeter 40 and incircle radius 3.

Find its area.`,answers:["60"],hints:["Split it into four triangles from the incentre I.","Each triangle has height r over one side.","Area = ½·r·(perimeter) = r·s."],solution:"Joining I to the four vertices gives four triangles with height 3 over the four sides. Area = ½·3·40 = 60."},{type:"proof",q:"Prove Pitot’s theorem: if a circle touches all four sides of the quadrilateral ABCD, then AB + CD = BC + DA.",hints:["Name the four touching points.","The two tangents from one point to a circle are equally long.","Call these lengths a, b, c, d."],keySteps:["Let the circle touch AB, BC, CD, DA at P, Q, R, S.","Equal tangents: AP = AS = a, BP = BQ = b, CQ = CR = c, DR = DS = d.","AB + CD = a + b + c + d.","BC + DA = b + c + d + a, so the sums are equal."],solution:`Let the circle touch AB at P, BC at Q, CD at R and DA at S. The two tangent segments from a point are equal, so AP = AS = a, BP = BQ = b, CQ = CR = c and DR = DS = d.

The touching points lie on the sides, so AB = a + b, BC = b + c, CD = c + d, DA = d + a. Hence AB + CD = a + b + c + d = BC + DA.`}],challenge:{source:"Classic (converse of Pitot’s theorem)",q:`ABCD is a convex quadrilateral with AB + CD = BC + DA.

Prove that ABCD has an incircle.`,keySteps:["∠A + ∠B < 360°, so the bisectors at A and B meet at a point I inside; the circle k around I touches DA, AB and BC.","If k does not touch CD, draw the other tangent from D to k; it meets line BC at C′ ≠ C, and ABC′D is tangential.","Pitot for ABC′D: AB + C′D = BC′ + DA. Subtract from the given equation: CD − C′D = BC − BC′ = ±CC′.","So one of CD, C′D, CC′ is the sum of the other two: C, C′, D collinear; since C, C′ are on line BC and D is not, C = C′. Contradiction."],solution:`The bisectors of the angles at A and B meet at a point I inside the quadrilateral (the half-angles add up to less than 180°). I is equally far from the lines DA, AB and BC, so the circle k with centre I and this radius touches the three sides DA, AB and BC.

Suppose k does not touch CD. From D draw the second tangent to k (the first one is DA). It meets the line BC at a point C′ ≠ C on the ray BC (in the usual figure; the degenerate positions are handled the same way), and ABC′D is a quadrilateral whose four sides touch k, so by Pitot
AB + C′D = BC′ + DA.
Subtracting this from AB + CD = BC + DA gives
CD − C′D = BC − BC′.

C and C′ are on the line BC, on the same side of B, so BC − BC′ = CC′ if C′ lies between B and C, and = −CC′ otherwise. So either CD = C′D + CC′ or C′D = CD + CC′. In both cases the triangle inequality in triangle CC′D becomes an equality, so C, C′, D lie on one line. But that line is BC, and D is not on BC. Contradiction.

So k touches CD as well, and ABCD has an incircle.`}},80:{lesson:{idea:`Law of sines (Sinussatz): a/sin α = b/sin β = c/sin γ (= 2R). Use it when you know two angles and a side, or want to turn a ratio of sides into a ratio of sines.

Law of cosines (Kosinussatz): a² = b² + c² − 2bc·cos α. It is Pythagoras with a correction term. Use it when you know two sides and the angle between them, or all three sides and want an angle.

Why the cosine law: drop the altitude from C; with Pythagoras in the two right triangles, the projection of b onto c is b·cos α, and the difference of the squares gives the formula.

The angle is obtuse exactly when a² > b² + c². Classic application: the median length m_a² = (2b² + 2c² − a²)/4. Trap: cos is negative for obtuse angles (cos 120° = −½), so the term −2bc·cos α becomes a plus.`,steps:["SAS or SSS: use the cosine law.","ASA or AAS, or ratios: use the sine law.","Learn the values for 30°, 45°, 60°, 90°, 120°, 135°, 150°.","Two triangles sharing a point on a side: the angles there are supplementary, so their cosines are opposite."],example:{q:"In triangle ABC, AC = 5, AB = 8 and ∠A = 60°. Find BC.",a:"BC² = 25 + 64 − 2·5·8·½ = 49, so BC = 7."},de:[["Sinussatz","law of sines"],["Kosinussatz","law of cosines"],["Schwerlinie","median"],["eingeschlossener Winkel","included angle"]]},problems:[{type:"answer",q:`A triangle has sides 3, 5 and 7.

Find its largest angle in degrees.`,answers:["120"],hints:["The largest angle is opposite the longest side.","Cosine law: 49 = 9 + 25 − 2·3·5·cos θ.","cos θ = −½."],solution:"49 = 34 − 30 cos θ, so cos θ = −15/30 = −½ and θ = 120°."},{type:"answer",q:`Triangle ABC has AB = 7, AC = 9 and BC = 8. M is the midpoint of BC.

Find AM.`,answers:["7"],hints:["Use the cosine law in ABM and in ACM.","The angles at M are supplementary, so their cosines cancel when you add.","AB² + AC² = 2AM² + BC²/2."],solution:"Median formula: AM² = (2·81 + 2·49 − 64)/4 = 196/4 = 49, so AM = 7."},{type:"proof",q:`In triangle ABC, M is the midpoint of BC, a = BC, b = CA, c = AB and m = AM.

Prove that b² + c² = 2m² + a²/2.`,hints:["Let θ = ∠AMB. Then ∠AMC = 180° − θ.","Cosine law in triangle ABM and in triangle ACM.","cos(180° − θ) = −cos θ."],keySteps:["Let θ = ∠AMB, so ∠AMC = 180° − θ and BM = MC = a/2.","Triangle ABM: c² = m² + a²/4 − a·m·cos θ.","Triangle ACM: b² = m² + a²/4 + a·m·cos θ.","Adding: b² + c² = 2m² + a²/2."],solution:`Let θ = ∠AMB; then ∠AMC = 180° − θ and BM = MC = a/2.

Cosine law in triangle ABM: c² = m² + (a/2)² − 2·m·(a/2)·cos θ = m² + a²/4 − am·cos θ.
Cosine law in triangle ACM: b² = m² + a²/4 − am·cos(180° − θ) = m² + a²/4 + am·cos θ.

Adding the two equations, the cosine terms cancel: b² + c² = 2m² + a²/2.`}],challenge:{source:"Classic",q:`In triangle ABC with a = BC, b = CA, c = AB we have a² = b(b + c).

Prove that ∠BAC = 2·∠ABC.`,keySteps:["Extend CA beyond A to D with AD = c, so CD = b + c and a² = CA·CD, i.e. CA/CB = CB/CD.","Triangles CAB and CBD share the angle C, so they are similar (SAS): ∠CDB = ∠CBA.","Triangle ABD is isosceles (AB = AD = c): ∠ABD = ∠ADB.","Outer angle of ABD at A: ∠BAC = ∠ABD + ∠ADB = 2∠ADB = 2∠CBA."],solution:`Extend the side CA beyond A to the point D with AD = AB = c. Then CD = b + c, and the condition says CB² = CA·CD, i.e. CA/CB = CB/CD.

Triangles CAB and CBD have the common angle at C and the sides around it in the same ratio, so they are similar (C ↦ C, A ↦ B, B ↦ D). Hence ∠CDB = ∠CBA.

Triangle ABD is isosceles with AB = AD, so ∠ABD = ∠ADB = ∠CDB = ∠CBA.

∠BAC is the outer angle at A of triangle ABD (because D lies on the extension of CA beyond A), so ∠BAC = ∠ABD + ∠ADB = 2∠CBA.

(With trigonometry: the cosine law and the sine law turn the condition into sin(α − β) = sin β, which also gives α = 2β.)`}},84:{lesson:{idea:`Triangle inequality (Dreiecksungleichung): for any three points, XZ ≤ XY + YZ, with equality only if Y lies on the segment XZ. In a triangle every side is shorter than the sum of the other two and longer than their difference: |b − c| < a < b + c.

For a convex quadrilateral ABCD the diagonals meet at a point O inside. Apply the inequality in the four small triangles: AB + CD < AC + BD and BC + DA < AC + BD. So the diagonals together are longer than either pair of opposite sides (and longer than half the perimeter).

When to use: inequalities between lengths, “shortest path”, “minimise PA + PB + …”. Trick: insert the intersection point of the diagonals and split each diagonal into two parts. Trap: say why the inequality is strict (the three points are not on one line).`,steps:["Look for a broken line (X → Y → Z) and compare it with the straight segment.","In a quadrilateral, use the intersection O of the diagonals.","Add the inequalities from several triangles.","For a minimum: find the point where every inequality becomes an equality."],example:{q:"Is there a triangle with sides 2, 3, 6?",a:"No: 2 + 3 = 5 < 6, so the side 6 is too long."},de:[["Dreiecksungleichung","triangle inequality"],["Diagonale","diagonal"],["konvexes Viereck","convex quadrilateral"],["Umfang","perimeter"]]},problems:[{type:"answer",q:`ABCD is a rectangle with AB = 6 and BC = 8. P is any point in the plane.

Find the smallest possible value of PA + PB + PC + PD.`,answers:["20"],hints:["Pair the vertices along the diagonals.","PA + PC ≥ AC and PB + PD ≥ BD.","When are both equalities true at once?"],solution:"PA + PC ≥ AC = 10 and PB + PD ≥ BD = 10, so the sum is at least 20. At the centre of the rectangle P lies on both diagonals and the sum is exactly 20."},{type:"answer",q:`A triangle has two sides of lengths 7 and 11, and the third side is a whole number.

How many possible lengths are there for the third side?`,answers:["13"],hints:["The third side x must satisfy |11 − 7| < x < 11 + 7.","So 4 < x < 18.","Count the integers from 5 to 17."],solution:"We need 4 < x < 18, so x = 5, 6, …, 17: 13 values."},{type:"proof",q:`ABCD is a convex quadrilateral.

Prove that AB + CD < AC + BD.`,hints:["Use the point where the diagonals meet.","Call it O. It lies on both diagonals.","Triangle inequality in triangles ABO and CDO."],keySteps:["In a convex quadrilateral the diagonals meet at a point O inside both segments.","Triangle ABO: AB < AO + OB (strict, O is not on AB).","Triangle CDO: CD < CO + OD.","Adding: AB + CD < (AO + OC) + (BO + OD) = AC + BD."],solution:`The quadrilateral is convex, so the diagonals AC and BD meet at a point O that lies on both segments. O is not on the line AB (otherwise the quadrilateral would be degenerate), so the triangle inequality in triangle ABO is strict: AB < AO + OB. In the same way CD < CO + OD.

Adding: AB + CD < AO + OC + BO + OD = AC + BD.`}],challenge:{source:"Classic",q:`ABCD is a convex quadrilateral with AB + BD ≤ AC + CD.

Prove that AB < AC.`,keySteps:["Let O be the intersection of the diagonals.","Triangle inequality in ABO and CDO: AB + CD < AC + BD.","Add the given inequality AB + BD ≤ AC + CD.","BD and CD cancel: 2AB < 2AC."],solution:`Let O be the intersection of the diagonals; it lies on both segments AC and BD. By the triangle inequality in triangles ABO and DCO,
AB < AO + OB and CD < CO + OD,
so AB + CD < AC + BD.

Adding the given inequality AB + BD ≤ AC + CD:
AB + CD + AB + BD < AC + BD + AC + CD,
so 2AB < 2AC and AB < AC.`}},88:{lesson:{idea:`Power of a point (Potenz eines Punktes): for a point P and a circle with centre O and radius r, every line through P that meets the circle at X and Y gives the same product

PX·PY = |PO² − r²|.

Special cases:
• Intersecting chords (Sehnensatz): chords AB and CD meet at P inside: PA·PB = PC·PD.
• Secants (Sekantensatz): P outside, PA·PB = PC·PD.
• Tangent: PT² = PA·PB (Sekanten-Tangentensatz).

Why: triangles PAC and PDB are similar (vertical or common angle at P, and inscribed angles ∠PAC = ∠PDB). For the tangent use the tangent-chord angle.

The points with equal power with respect to two circles form a line, the radical axis (Potenzgerade); for two intersecting circles it is the line through the two intersection points. Trap: always measure from P to both points, not PA·AB.`,steps:["Find a point where two chords or secants (or a tangent) meet.","Write PA·PB = PC·PD (or = PT²).","Distances from P, not the chord lengths!","Two circles: a point on the common chord line has equal power to both."],example:{q:"From P a secant meets a circle at A and B with PA = 2, PB = 8. How long is the tangent from P?",a:"PT² = 2·8 = 16, so PT = 4."},de:[["Potenz eines Punktes","power of a point"],["Sehnensatz","intersecting chords theorem"],["Sekantensatz / Sekanten-Tangentensatz","secant theorem / tangent-secant theorem"],["Potenzgerade","radical axis"]]},problems:[{type:"answer",q:`Two chords AB and CD of a circle meet at P. AP = 4, PB = 6 and CP = 3.

Find the length of the chord CD.`,answers:["11"],hints:["Intersecting chords theorem.","PA·PB = PC·PD.","24 = 3·PD."],solution:"PA·PB = PC·PD, so 24 = 3·PD and PD = 8. CD = 3 + 8 = 11."},{type:"answer",q:`From a point P outside a circle, the tangent PT has length 6. The line through P and the centre meets the circle at A and B, with PA = 4 < PB.

Find the radius of the circle.`,answers:["2.5","5/2"],hints:["Tangent-secant theorem.","PT² = PA·PB.","PB = 9, and AB is a diameter."],solution:"PT² = PA·PB, so 36 = 4·PB and PB = 9. AB = 9 − 4 = 5 is a diameter, so the radius is 5/2."},{type:"proof",q:`From a point P outside a circle, a tangent touches the circle at T, and a line through P meets the circle at A and B, with A between P and B.

Prove that PT² = PA·PB.`,hints:["Look for two similar triangles with vertex P.","Triangles PTA and PBT share the angle at P.","Tangent-chord angle: ∠PTA = ∠TBA."],keySteps:["Triangles PTA and PBT share the angle at P.","Tangent-chord angle for the chord TA: ∠PTA = ∠TBA = ∠PBT.","So the triangles are similar (AA): PT/PB = PA/PT.","Hence PT² = PA·PB."],solution:`Triangles PTA and PBT have the common angle at P. The angle between the tangent TP and the chord TA equals the inscribed angle on TA from the other side, which is ∠TBA (B lies on the other side of TA from P). Since A lies on segment PB, ∠TBA = ∠PBT. So ∠PTA = ∠PBT.

The triangles PTA and PBT are similar (two equal angles), so PT/PB = PA/PT, i.e. PT² = PA·PB.`}],challenge:{source:"Classic",q:`Two circles meet at A and B. A common tangent touches the first circle at T₁ and the second at T₂.

Prove that the line AB passes through the midpoint of T₁T₂.`,keySteps:["The line AB meets the line T₁T₂ at some point M (they are not parallel).","Power of M with respect to the first circle: MT₁² = MA·MB.","Power of M with respect to the second circle: MT₂² = MA·MB.","So MT₁ = MT₂, and M lies on segment T₁T₂: it is the midpoint."],solution:`First, the lines AB and T₁T₂ meet. AB is perpendicular to the line of centres O₁O₂. If T₁T₂ were also perpendicular to O₁O₂, the radii O₁T₁ and O₂T₂ (both perpendicular to T₁T₂) would lie on the line O₁O₂, so both circles would touch T₁T₂ at the same point of that line. Then that point would be a common point of both circles where they touch, and the circles could not meet in two points A and B. So the lines meet at a point M.

M lies on a tangent of both circles, so it is outside both of them. Tangent-secant theorem for the first circle: MT₁² = MA·MB. For the second circle: MT₂² = MA·MB.

So MT₁ = MT₂. M lies on the line T₁T₂ and T₁ ≠ T₂ (the circles meet in two points, so they do not touch), and the only point of a line equally far from two different points of it is their midpoint. So M is the midpoint of T₁T₂.`}},96:{lesson:{idea:`Many geometry problems open up with one good extra line (Hilfslinie). The four most useful moves:

1. Double a median: extend AM by its own length to D. Then ABDC is a parallelogram, and sides become diagonals.
2. Reflect (Spiegeln): to minimise AP + PB with P on a line, reflect A in the line; the shortest path is straight. Reflecting also turns angle bisectors into symmetries.
3. Draw a parallel: it transfers angles (corresponding/alternate) and ratios (intercept theorem).
4. Rotate a piece of the figure (squares and equilateral triangles have 90° and 60° rotations built in) so that scattered segments become one line.

How to choose: ask which segments or angles you want to bring together, and pick the move that puts them into one triangle. Trap: after constructing a point, prove its properties (collinear? on the side?); do not just read them off the drawing.`,steps:["Write down which pieces should end up next to each other.","Median or midpoint? Double it.","Sum of two distances to a line? Reflect.","Square or equilateral triangle? Rotate by 90° or 60°."],example:{q:"A(0, 1) and B(3, 3) lie above the x-axis. Find the minimum of AP + PB for P on the x-axis.",a:"Reflect A to A′(0, −1). AP = A′P, so AP + PB ≥ A′B = √(9 + 16) = 5, with equality where A′B crosses the axis."},de:[["Hilfslinie","auxiliary line"],["Spiegelung","reflection"],["Parallele ziehen","draw a parallel"],["Drehung","rotation"]]},problems:[{type:"answer",q:`A river runs along the x-axis. A cow is at A(0, 2) and its barn is at B(12, 3). The cow walks to the river to drink at a point P and then to the barn.

Find the length of the shortest such walk.`,answers:["13"],hints:["Reflect one of the points in the river.","A′ = (0, −2) and A′P = AP.","The shortest walk is the straight segment A′B."],solution:"Reflect A in the x-axis to A′(0, −2). For every P on the axis, AP + PB = A′P + PB ≥ A′B = √(12² + 5²) = 13, with equality where A′B crosses the axis."},{type:"answer",q:`In triangle ABC, AB = 13, AC = 15, and the median from A to the midpoint M of BC has length AM = 7.

Find the area of triangle ABC.`,answers:["84"],hints:["Double the median.","Extend AM to D with MD = AM. ABDC is a parallelogram.","Triangle ABD has sides 13, 15, 14 and the same area as ABC."],solution:"Extend AM to D with MD = AM = 7. The diagonals of ABDC bisect each other, so it is a parallelogram and BD = AC = 15. Triangle ABD has sides 13, 15, 14, so (Heron, s = 21) its area is √(21·8·6·7) = 84. Also [ABD] = 2[ABM] = [ABC], so the area is 84."},{type:"proof",q:`In triangle ABC, M is the midpoint of BC.

Prove that AM < (AB + AC)/2.`,hints:["Double the median.","Extend AM beyond M to D with MD = AM.","ABDC is a parallelogram, so BD = AC."],keySteps:["Extend AM to D with MD = AM.","The diagonals AD and BC bisect each other, so ABDC is a parallelogram: BD = AC.","Triangle inequality in ABD (A, B, D not collinear): AD < AB + BD.","2AM < AB + AC."],solution:`Extend AM beyond M to the point D with MD = AM. In the quadrilateral ABDC the diagonals AD and BC bisect each other (at M), so it is a parallelogram, and BD = AC.

A, B, D are not on one line (otherwise A would lie on BC), so by the triangle inequality AD < AB + BD. That is 2·AM < AB + AC.`}],challenge:{source:"Classic",q:`ABCD is a square. E lies on side BC and F on side CD such that ∠EAF = 45°.

Prove that BE + DF = EF.`,keySteps:["Rotate triangle ADF about A by 90° so that D goes to B; F goes to a point G.","∠ABG = ∠ADF = 90°, so G lies on line CB, beyond B; BG = DF and AG = AF.","∠GAE = ∠GAB + ∠BAE = ∠DAF + ∠BAE = 90° − 45° = 45° = ∠EAF.","Triangles GAE and FAE are congruent (SAS), so EF = GE = GB + BE = DF + BE."],solution:`Rotate the triangle ADF about A by 90° so that D goes to B (AD = AB and ∠DAB = 90°). Let G be the image of F. Then AG = AF, BG = DF, and ∠ABG = ∠ADF = 90°.

Since also ∠ABE = 90°, the points G, B, E lie on one line, and G is on the other side of B from E: the rotation maps the square ABCD to the square on the other side of AB, so the side DC goes to a segment of line BC that starts at B and points away from C. So GE = GB + BE = DF + BE.

∠GAB = ∠FAD, so ∠GAE = ∠GAB + ∠BAE = ∠FAD + ∠BAE = 90° − ∠EAF = 45° = ∠EAF.

Triangles GAE and FAE have AG = AF, the common side AE and the equal angles between them, so they are congruent (SAS). Hence EF = GE = BE + DF.`}},100:{lesson:{idea:`Two universal tools for when clever ideas run out.

Trigonometry in the triangle: area = ½·ab·sin γ, the sine law, the cosine law, and in right triangles opposite = hypotenuse·sin, adjacent = hypotenuse·cos. Write unknown lengths in terms of angles and R, then simplify.

Coordinates (Koordinaten als Notlösung): place the figure cleverly so the numbers are small. Typical choices: a right angle at the origin with the legs on the axes; a side on the x-axis with its midpoint at the origin; for medians, the centroid at the origin. Tools: distance = √(Δx² + Δy²), midpoint = average, perpendicular lines have slopes m and −1/m, area = ½|x₁y₂ − x₂y₁| for a triangle with a vertex at the origin.

Why “Notlösung”: it always works for statements about distances and perpendicularity, but it can get long. Trap: keep the setup general (letters, not numbers) unless the problem fixes the figure.`,steps:["Choose the origin and axes to use symmetry or right angles.","Give the points coordinates with as few letters as possible.","Translate the claim into an equation (distances squared, dot product = 0).","Expand and simplify; check the result on a special case."],example:{q:"Two sides of a triangle are 6 and 10 and the angle between them is 150°. Find the area.",a:"Area = ½·6·10·sin 150° = ½·60·½ = 15."},de:[["Trigonometrie","trigonometry"],["Koordinatensystem","coordinate system"],["Ursprung","origin"],["senkrecht","perpendicular"]]},problems:[{type:"answer",q:`Two sides of a triangle have lengths 5 and 8, and the angle between them is 30°.

Find the area of the triangle.`,answers:["10"],hints:["Area with two sides and the included angle.","Area = ½·a·b·sin γ.","sin 30° = ½."],solution:"Area = ½·5·8·½ = 10."},{type:"answer",q:`ABCD is a square with side 12. M is the midpoint of CD, and the segment AM meets the diagonal BD at P.

Find the area of triangle APB.`,answers:["48"],hints:["Use coordinates with A at the origin.","A(0, 0), B(12, 0), D(0, 12), M(6, 12). Write AM and BD as lines.","AM: y = 2x. BD: x + y = 12."],solution:"With A(0, 0), B(12, 0), C(12, 12), D(0, 12) we get M(6, 12). AM is y = 2x and BD is x + y = 12, so P = (4, 8). Triangle APB has base AB = 12 and height 8: area 48."},{type:"proof",q:`ABCD is a rectangle and P is any point in the plane.

Prove that PA² + PC² = PB² + PD².`,hints:["Use coordinates with the rectangle on the axes.","A(0, 0), B(p, 0), C(p, q), D(0, q), P(x, y).","Write out all four squared distances."],keySteps:["Coordinates: A(0, 0), B(p, 0), C(p, q), D(0, q), P(x, y).","PA² + PC² = x² + y² + (x − p)² + (y − q)².","PB² + PD² = (x − p)² + y² + x² + (y − q)².","Both sums consist of the same four squares, so they are equal."],solution:`Put the rectangle in a coordinate system: A(0, 0), B(p, 0), C(p, q), D(0, q), and let P = (x, y). Then
PA² + PC² = [x² + y²] + [(x − p)² + (y − q)²],
PB² + PD² = [(x − p)² + y²] + [x² + (y − q)²].
Both are the sum of the same four squares x², y², (x − p)², (y − q)², so they are equal.`}],challenge:{source:"Classic",q:`In triangle ABC with a = BC, b = CA, c = AB, the median from A is perpendicular to the median from B.

Prove that a² + b² = 5c².`,keySteps:["Put the centroid G at the origin; the medians from A and B pass through G and are perpendicular.","Choose axes along them: A = (p, 0), B = (0, q); then C = −A − B = (−p, −q).","c² = p² + q², a² = BC² = p² + 4q², b² = AC² = 4p² + q².","a² + b² = 5p² + 5q² = 5c²."],solution:`The centroid G lies on both medians. Put G at the origin and the axes along the two perpendicular medians, so A = (p, 0) and B = (0, q) for some p, q ≠ 0. For the centroid at the origin we need A + B + C = 0, so C = (−p, −q).

Now
c² = AB² = p² + q²,
a² = BC² = (0 + p)² + (q + q)² = p² + 4q²,
b² = CA² = (p + p)² + (0 + q)² = 4p² + q².

So a² + b² = 5p² + 5q² = 5c².`}}};export{e as default};
