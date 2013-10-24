/* global d3 */
/* global QUnit, module, expect */
/* global SplitsBrowser */

(function (){
    "use strict";

    var compareCompetitors = SplitsBrowser.Model.compareCompetitors;
    var fromSplitTimes = SplitsBrowser.Model.Competitor.fromSplitTimes;
    var fromCumTimes = SplitsBrowser.Model.Competitor.fromCumTimes;

    function signum(n) {
        return (n < 0) ? -1 : ((n > 0) ? 1 : 0);
    }

    module("Competitor");
    
    var assertSplitTimes = function (assert, competitor, expectedSplitTimes) {
        expectedSplitTimes.forEach(function (splitTime, controlIdx) {
            assert.equal(competitor.getSplitTimeTo(controlIdx + 1), splitTime);
        });
    };
    
    var assertCumulativeTimes = function (assert, competitor, expectedCumulativeTimes) {
        expectedCumulativeTimes.forEach(function (splitTime, controlIdx) {
            assert.equal(competitor.getCumulativeTimeTo(controlIdx), splitTime);
        });
    };

    QUnit.test("Cannot create a competitor from split times when the split times argument isn't a array", function (assert) {
        try {
            fromSplitTimes(1, "John", "Smith", "ABC", 10 * 3600, "This is not an array");
            assert.ok(false, "Should not get here");
        } catch (e) {
            assert.equal(e.name, "TypeError", "Exception should have name TypeError: exception message is " + e.message);
        }
    });

    QUnit.test("Cannot create a competitor from an empty array of split times", function (assert) {
        try {
            fromSplitTimes(1, "John", "Smith", "ABC", 10 * 3600, []);
            assert.ok(false, "Should not get here");
        } catch (e) {
            assert.equal(e.name, "InvalidData", "Exception should have name InvalidData: exception message is " + e.message);
        }
    });

    QUnit.test("Can create a competitor from split times and determine cumulative times", function (assert) {
        var competitor = fromSplitTimes(1, "John", "Smith", "ABC", 10 * 3600, [65, 221, 184, 100]);
        assertCumulativeTimes(assert, competitor, [0, 65, 65 + 221, 65 + 221 + 184, 65 + 221 + 184 + 100]);
        assert.deepEqual(competitor.getAllCumulativeTimes(), [0, 65, 65 + 221, 65 + 221 + 184, 65 + 221 + 184 + 100]);
        assertSplitTimes(assert, competitor, [65, 221, 184, 100]);
        assert.ok(competitor.completed(), "Competitor should be marked as completing the course");
        assert.ok(!competitor.isNonCompetitive, "Competitor should be competitive");
        assert.equal(competitor.getSuffix(), "", "Competitor should have no suffix");
    });

    QUnit.test("Can create a non-competitive competitor from split times and determine cumulative times", function (assert) {
        var competitor = fromSplitTimes(1, "John", "Smith", "ABC", 10 * 3600, [65, 221, 184, 100]);
        competitor.setNonCompetitive();
        assert.ok(competitor.isNonCompetitive, "Competitor should not be competitive");
        assert.equal(competitor.getSuffix(), "n/c", "Competitor should have non-competitive suffix");
    });

    QUnit.test("Can create a competitor from split times and determine cumulative times when competitor has missed a control", function (assert) {
        var competitor = fromSplitTimes(1, "John", "Smith", "ABC", 10 * 3600, [65, 221,  null, 184, 100]);
        assertCumulativeTimes(assert, competitor, [0, 65, 65 + 221, null, null, null]);
        assertSplitTimes(assert, competitor, [65, 221, null, 184, 100]);
        assert.ok(!competitor.completed(), "Competitor should be marked as not completing the course");
        assert.equal(competitor.getSuffix(), "mp", "Competitor should have mispunched suffix");
    });

    QUnit.test("Can create a competitor from split times and determine cumulative times when competitor has missed multiple consecutive controls", function (assert) {
        var competitor = fromSplitTimes(1, "John", "Smith", "ABC", 10 * 3600, [65, 221, null, null, null, null, 184, 100]);
        assertCumulativeTimes(assert, competitor, [0, 65, 65 + 221, null, null, null, null, null, null]);
        assertSplitTimes(assert, competitor, [65, 221, null, null, null, null, 184, 100]);
        assert.ok(!competitor.completed(), "Competitor should be marked as not completing the course");
    });

    QUnit.test("Cannot create a competitor from cumulative times when the cumulative times argument isn't an array", function (assert) {
        try {
            fromCumTimes(1, "John", "Smith", "ABC", 10 * 3600, "This is not an array");
            assert.ok(false, "Should not get here");
        } catch (e) {
            assert.equal(e.name, "TypeError", "Exception should have name TypeError: exception message is " + e.message);
        }
    });

    QUnit.test("Cannot create a competitor from an empty array of cumulative times", function (assert) {
        try {
            fromCumTimes(1, "John", "Smith", "ABC", 10 * 3600, []);
            assert.ok(false, "Should not get here");
        } catch (e) {
            assert.equal(e.name, "InvalidData", "Exception should have name InvalidData: exception message is " + e.message);
        }
    });

    QUnit.test("Cannot create a competitor from an array of cumulative times that does not start with zero", function (assert) {
        try {
            fromCumTimes(1, "John", "Smith", "ABC", 10 * 3600, [40, 60, 90]);
            assert.ok(false, "Should not get here");
        } catch (e) {
            assert.equal(e.name, "InvalidData", "Exception should have name InvalidData: exception message is " + e.message);
        }
    });

    QUnit.test("Cannot create a competitor from an array of cumulative times containing only a single zero", function (assert) {
        try {
            fromCumTimes(1, "John", "Smith", "ABC", 10 * 3600, [0]);
            assert.ok(false, "Should not get here");
        } catch (e) {
            assert.equal(e.name, "InvalidData", "Exception should have name InvalidData: exception message is " + e.message);
        }
    });

    QUnit.test("Can create a competitor from cumulative times and determine split times", function (assert) {
        var cumTimes = [0, 65, 65 + 221, 65 + 221 + 184, 65 + 221 + 184 + 100];
        var competitor = fromCumTimes(1, "John", "Smith", "ABC", 10 * 3600, cumTimes);
        assertCumulativeTimes(assert, competitor, cumTimes);
        assert.deepEqual(competitor.getAllCumulativeTimes(), cumTimes);
        assertSplitTimes(assert, competitor, [65, 221, 184, 100]);
        assert.ok(competitor.completed(), "Competitor should be marked as completing the course");
    });

    QUnit.test("Can create a competitor from cumulative times and determine split times when competitor has missed a control", function (assert) {
        var cumTimes = [0, 65, null, 65 + 221, 65 + 221 + 184, 65 + 221 + 184 + 100];
        var competitor = fromCumTimes(1, "John", "Smith", "ABC", 10 * 3600, cumTimes);
        assertCumulativeTimes(assert, competitor, cumTimes);
        assert.deepEqual(competitor.getAllCumulativeTimes(), cumTimes);
        assertSplitTimes(assert, competitor, [65, null, null, 184, 100]);
        assert.ok(!competitor.completed(), "Competitor should be marked as not completing the course");
    });

    QUnit.test("Can create a competitor from cumulative times and determine split times when competitor has missed multiple consecutive controls", function (assert) {
        var cumTimes = [0, 65, null, null, null, 65 + 221, 65 + 221 + 184, 65 + 221 + 184 + 100];
        var competitor = fromCumTimes(1, "John", "Smith", "ABC", 10 * 3600, cumTimes);
        assertCumulativeTimes(assert, competitor, cumTimes);
        assertSplitTimes(assert, competitor, [65, null, null, null, null, 184, 100]);
        assert.ok(!competitor.completed(), "Competitor should be marked as not completing the course");
    });

    QUnit.test("Can determine total time of a competitor that punches all controls", function (assert) {
        var competitor = fromSplitTimes(1, "John", "Smith", "ABC", 10 * 3600, [65, 221, 184, 100]);
        assert.equal(competitor.totalTime, 65 + 221 + 184 + 100, "Wrong total time");
    });

    QUnit.test("Determines total time of a competitor that mispunches as null", function (assert) {
        var competitor = fromSplitTimes(1, "John", "Smith", "ABC", 10 * 3600, [65, 221, null, 100]);
        assert.strictEqual(competitor.totalTime, null, "Total time should be null");
    });
    
    QUnit.test("Competitor with valid time compares equal to itself", function (assert) {
        var competitor = fromSplitTimes(1, "John", "Smith", "ABC", 10 * 3600, [154]);
        assert.equal(compareCompetitors(competitor, competitor), 0);
    });

    QUnit.test("Competitor with lower total time comes before competitor with higher total time", function (assert) {
        var competitor1 = fromSplitTimes(1, "John", "Smith", "ABC", 10 * 3600, [154]);
        var competitor2 = fromSplitTimes(2, "Fred", "Baker", "DEF", 12 * 3600, [188]);
        assert.equal(signum(compareCompetitors(competitor1, competitor2)), -1);
    });

    QUnit.test("Competitor with higher total time comes before competitor with higher total time", function (assert) {
        var competitor1 = fromSplitTimes(1, "John", "Smith", "ABC", 10 * 3600, [188]);
        var competitor2 = fromSplitTimes(2, "Fred", "Baker", "DEF", 12 * 3600, [154]);
        assert.ok(signum(compareCompetitors(competitor1, competitor2)), 1);
    });

    QUnit.test("Competitor with lower order comes before competitor with same total time but higher order", function (assert) {
        var competitor1 = fromSplitTimes(1, "John", "Smith", "ABC", 10 * 3600, [188]);
        var competitor2 = fromSplitTimes(2, "Fred", "Baker", "DEF", 12 * 3600, [188]);
        assert.ok(signum(compareCompetitors(competitor1, competitor2)) , -1);
    });

    QUnit.test("Competitor with higher order comes after competitor with same total time but lower order", function (assert) {
        var competitor1 = fromSplitTimes(3, "John", "Smith", "ABC", 10 * 3600, [188]);
        var competitor2 = fromSplitTimes(2, "Fred", "Baker", "DEF", 12 * 3600, [188]);
        assert.ok(signum(compareCompetitors(competitor1, competitor2)), 1);
    });

    QUnit.test("Competitor with valid time comes before mispunching competitor", function (assert) {
        var competitor1 = fromSplitTimes(1, "John", "Smith", "ABC", 10 * 3600, [154]);
        var competitor2 = fromSplitTimes(2, "Fred", "Baker", "DEF", 12 * 3600, [null]);
        assert.ok(signum(compareCompetitors(competitor1, competitor2)) , -1);
    });

    QUnit.test("Mispunching competitor compares equal to itself", function (assert) {
        var competitor = fromSplitTimes(1, "John", "Smith", "ABC", 10 * 3600, [null]);
        assert.equal(compareCompetitors(competitor, competitor), 0);
    });

    QUnit.test("Mispunching competitor comes after competitor with valid time", function (assert) {
        var competitor1 = fromSplitTimes(1, "John", "Smith", "ABC", 10 * 3600, [null]);
        var competitor2 = fromSplitTimes(2, "Fred", "Baker", "DEF", 12 * 3600, [188]);
        assert.ok(signum(compareCompetitors(competitor1, competitor2)), 1);
    });

    QUnit.test("Mispunching competitor with lower order comes before mispunching competitor with higher order", function (assert) {
        var competitor1 = fromSplitTimes(1, "John", "Smith", "ABC", 10 * 3600, [null]);
        var competitor2 = fromSplitTimes(2, "Fred", "Baker", "DEF", 12 * 3600, [null]);
        assert.ok(signum(compareCompetitors(competitor1, competitor2)) , -1);
    });

    QUnit.test("Mispunching competitor with higher order comes before mispunching competitor with lower order", function (assert) {
        var competitor1 = fromSplitTimes(3, "John", "Smith", "ABC", 10 * 3600, [null]);
        var competitor2 = fromSplitTimes(2, "Fred", "Baker", "DEF", 12 * 3600, [null]);
        assert.ok(signum(compareCompetitors(competitor1, competitor2)), 1);
    });

    QUnit.test("Can adjust a competitor's cumulative times by reference data with all valid times and same number of controls", function (assert) {

        var competitor = fromSplitTimes(1, "John", "Smith", "ABC", 10 * 3600, [65, 221, 184, 100]);
        var referenceCumTimes = [0, 61, 61 + 193, 61 + 193 + 176, 61 + 193 + 176 + 103];
        var expectedCumTimes = [0, 4, 4 + 28, 4 + 28 + 8, 4 + 28 + 8 - 3];
        assert.deepEqual(competitor.getCumTimesAdjustedToReference(referenceCumTimes), expectedCumTimes);
    });

    QUnit.test("Can adjust a competitor's cumulative times with a missing time by reference data with all valid times and same number of controls", function (assert) {

        var competitor = fromSplitTimes(1, "John", "Smith", "ABC", 10 * 3600, [65, 221, null, 100]);
        var referenceCumTimes = [0, 61, 61 + 193, 61 + 193 + 176, 61 + 193 + 176 + 103];
        var expectedCumTimes = [0, 4, 4 + 28, null, null];
        assert.deepEqual(competitor.getCumTimesAdjustedToReference(referenceCumTimes), expectedCumTimes);
    });

    QUnit.test("Cannot adjust a competitor's cumulative times by reference data with a different number of times", function (assert) {

        var competitor = fromSplitTimes(1, "John", "Smith", "ABC", 10 * 3600, [65, 221, 184, 100]);
        var referenceCumTimes = [0, 61, 61 + 193, 61 + 193 + 176];
        
        try {
            competitor.getCumTimesAdjustedToReference(referenceCumTimes);
            assert.ok(false, "Should not get here");
        } catch (e) {
            assert.equal(e.name, "InvalidData", "Exception should have name InvalidData: exception message is " + e.message);
        }
    });

    QUnit.test("Cannot adjust a competitor's cumulative times by reference data with a null value", function (assert) {

        var competitor = fromSplitTimes(1, "John", "Smith", "ABC", 10 * 3600, [65, 221, 184, 100]);
        var referenceCumTimes = [0, 61, 61 + 193, null, 61 + 193 + 176 + 103];
        
        try {
            competitor.getCumTimesAdjustedToReference(referenceCumTimes);
            assert.ok(false, "Should not get here");
        } catch (e) {
            assert.equal(e.name, "InvalidData", "Exception should have name InvalidData: exception message is " + e.message);
        }
    });

    QUnit.test("Can adjust a competitor's cumulative times by reference data and add start time with all valid times and same number of controls", function (assert) {
        var startTime = 10 * 3600 + 41 * 60;
        var competitor = fromSplitTimes(1, "John", "Smith", "ABC", startTime, [65, 221, 184, 100]);
        var referenceCumTimes = [0, 61, 61 + 193, 61 + 193 + 176, 61 + 193 + 176 + 103];
        var expectedCumTimes = [startTime, startTime + 4, startTime + 4 + 28, startTime + 4 + 28 + 8, startTime + 4 + 28 + 8 - 3];
        assert.deepEqual(competitor.getCumTimesAdjustedToReferenceWithStartAdded(referenceCumTimes), expectedCumTimes);
    });

    QUnit.test("Can adjust a competitor's cumulative times with a missing time by reference data and add start time with all valid times and same number of controls", function (assert) {
        var startTime = 10 * 3600 + 41 * 60;
        var competitor = fromSplitTimes(1, "John", "Smith", "ABC", startTime, [65, 221, null, 100]);
        var referenceCumTimes = [0, 61, 61 + 193, 61 + 193 + 176, 61 + 193 + 176 + 103];
        var expectedCumTimes = [startTime, startTime + 4, startTime + 4 + 28, null, null];
        assert.deepEqual(competitor.getCumTimesAdjustedToReferenceWithStartAdded(referenceCumTimes), expectedCumTimes);
    });

    QUnit.test("Cannot adjust a competitor's cumulative times by reference data and add start time with a different number of times", function (assert) {

        var competitor = fromSplitTimes(1, "John", "Smith", "ABC", 10 * 3600 + 41 * 60, [65, 221, 184, 100]);
        var referenceCumTimes = [0, 61, 61 + 193, 61 + 193 + 176];
        
        try {
            competitor.getCumTimesAdjustedToReferenceWithStartAdded(referenceCumTimes);
            assert.ok(false, "Should not get here");
        } catch (e) {
            assert.equal(e.name, "InvalidData", "Exception should have name InvalidData: exception message is " + e.message);
        }
    });

    QUnit.test("Cannot adjust a competitor's cumulative times by reference data and add start time if reference data contains a null value", function (assert) {

        var competitor = fromSplitTimes(1, "John", "Smith", "ABC", 10 * 3600 + 41 * 60, [65, 221, 184, 100]);
        var referenceCumTimes = [0, 61, 61 + 193, null, 61 + 193 + 176 + 103];
        
        try {
            competitor.getCumTimesAdjustedToReferenceWithStartAdded(referenceCumTimes);
            assert.ok(false, "Should not get here");
        } catch (e) {
            assert.equal(e.name, "InvalidData", "Exception should have name InvalidData: exception message is " + e.message);
        }
    });

    QUnit.test("Can determine the percentages a competitor is behind reference data with all valid times and same number of controls", function (assert) {

        var competitor = fromSplitTimes(1, "John", "Smith", "ABC", 10 * 3600, [65, 221, 184, 100]);
        var referenceCumTimes = [0, 61, 61 + 193, 61 + 193 + 176, 61 + 193 + 176 + 103];
        var expectedPercentagesBehind = [0, 100 * (65 - 61) / 61, 100 * (221 - 193) / 193, 100 * (184 - 176) / 176, 100 * (100 - 103) / 103];
        assert.deepEqual(competitor.getSplitPercentsBehindReferenceCumTimes(referenceCumTimes), expectedPercentagesBehind);
    });

    QUnit.test("Can determine the percentages a competitor with a missing time is behind reference data with all valid times and same number of controls", function (assert) {

        var competitor = fromSplitTimes(1, "John", "Smith", "ABC", 10 * 3600, [65, 221, null, 100]);
        var referenceCumTimes = [0, 61, 61 + 193, 61 + 193 + 176, 61 + 193 + 176 + 103];
        var expectedPercentagesBehind = [0, 100 * (65 - 61) / 61, 100 * (221 - 193) / 193, null, 100 * (100 - 103) / 103];
        assert.deepEqual(competitor.getSplitPercentsBehindReferenceCumTimes(referenceCumTimes), expectedPercentagesBehind);
    });

    QUnit.test("Cannot determine the percentages a competitor is behind reference data with a different number of times", function (assert) {

        var competitor = fromSplitTimes(1, "John", "Smith", "ABC", 10 * 3600, [65, 221, 184, 100]);
        var referenceCumTimes = [0, 61, 61 + 193, 61 + 193 + 176];
        
        try {
            competitor.getSplitPercentsBehindReferenceCumTimes(referenceCumTimes);
            assert.ok(false, "Should not get here");
        } catch (e) {
            assert.equal(e.name, "InvalidData", "Exception should have name InvalidData: exception message is " + e.message);
        }
    });

    QUnit.test("Cannot determine the percentages a competitor is behind reference data with a null value", function (assert) {

        var competitor = fromSplitTimes(1, "John", "Smith", "ABC", 10 * 3600, [65, 221, 184, 100]);
        var referenceCumTimes = [0, 61, 61 + 193, null, 61 + 193 + 176 + 103];
        
        try {
            competitor.getSplitPercentsBehindReferenceCumTimes(referenceCumTimes);
            assert.ok(false, "Should not get here");
        } catch (e) {
            assert.equal(e.name, "InvalidData", "Exception should have name InvalidData: exception message is " + e.message);
        }
    });
})();
