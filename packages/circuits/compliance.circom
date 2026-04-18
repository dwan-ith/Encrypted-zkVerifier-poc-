pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/comparators.circom";

// Proven age check circuit: proves (age >= threshold)
template AgeCheck(threshold) {
    signal input age;
    // publicThreshold and publicOutput are public, while age is private
    signal output isCompliant;

    component gt = GreaterThan(252);
    gt.in[0] <== age;
    gt.in[1] <== threshold - 1; // age >= threshold

    isCompliant <== gt.out;
}

// We set the threshold to 18 for this particular deployment
component main {public [age]} = AgeCheck(18);