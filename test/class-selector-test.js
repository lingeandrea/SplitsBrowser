(function (){
    "use strict";

    var ClassSelector = SplitsBrowser.Controls.ClassSelector;
    var AgeClass = SplitsBrowser.Model.AgeClass;
    var Course = SplitsBrowser.Model.Course;

    module("Class Selector");

    var lastClassIdxs = null;
    var callCount = 0;

    function resetLastClass() {
        lastClassIdxs = null;
        callCount = 0;
    }

    function handleClassChanged(classIdxs) {
        lastClassIdxs = classIdxs;
        callCount += 1;
    }
        
    function setClassesInSelector(selector, classes) {
        var course = new Course("Test", classes, null, null);
        classes.forEach(function (cls) { cls.setCourse(course); });
        selector.setClasses(classes);
    }
        
    /**
    * Sets the selector to have three classes, the first being in a course of
    * its own and the other two sharing a course.
    * @param {SplitsBrowser.Controls.ClassSelector} selector -
                The class-selector to set up.
    */
    function setClassesInSelectorWithTwoCourses(selector) {
        var classes = [new AgeClass("Class 1", 11, []), new AgeClass("Class 2", 17, []), new AgeClass("Class 3", 22, [])];
        var course1 = new Course("Test 1", [classes[0]], null, null);
        var course2 = new Course("Test 2", classes.slice(1), null, null);        
        classes[0].setCourse(course1);
        course2.classes.forEach(function (cls) { cls.setCourse(course2); });
        selector.setClasses(classes);
    }
    
    function assertOtherClassSelectorVisibility(assert, isVisible) {
        var shouldOrShouldNot = (isVisible) ? "should" : "should not";
        var selector = d3.selectAll("#qunit-fixture .otherClassSelector");
        var combiningText = d3.selectAll("#qunit-fixture .otherClassCombining");
        assert.strictEqual(selector.size(), 1, "One other-class selector should be present");
        assert.strictEqual(combiningText.size(), 1, "One other-class combining-text element should be present");
        assert.strictEqual(selector.style("display"), (isVisible) ? "inline-block" : "none", "Other-class selector " + shouldOrShouldNot + " be displayed");
        assert.strictEqual(combiningText.style("display"), (isVisible) ? "inline" : "none", "Other-class combining-text element " + shouldOrShouldNot + " be displayed");
        
        if (!isVisible) {
            assertOtherClassListVisibility(assert, false);
        }
    }
    
    /**
    * Assert whether the div that contains the list of other classes is
    * visible, and, optionally, how many other classes are in this list.
    * @param {QUnit.assert} assert - QUnit assert object.
    * @param {boolean} isVisible - Whether the list of other classes should be
    *      visible.
    * @param {Number|undefined} itemCount - Optional number of items to check
    *      for in the list of other classes.  If omitted, no check is made.
    */
    function assertOtherClassListVisibility(assert, isVisible, itemCount) {
        var shouldOrShouldNot = (isVisible) ? "should" : "should not";
        var list = d3.selectAll("#qunit-fixture .otherClassList");
        assert.strictEqual(list.size(), 1, "One other-class list should be present");
        assert.strictEqual(list.style("display"), "none", "Other-class list element " + shouldOrShouldNot + "  be displayed");
    
        if (typeof itemCount !== "undefined") {
            var items = d3.selectAll("#qunit-fixture .otherClassList div.otherClassItem");
            assert.strictEqual(items.size(), itemCount, "Expected " + itemCount + " list item(s)");
        }
    }

    QUnit.test("Class selector created initially disabled and with only a dummy entry, with other-class selector hidden", function(assert) {
        new ClassSelector(d3.select("#qunit-fixture").node());
        
        var htmlSelectSelection = d3.select("#qunit-fixture select");
        assert.strictEqual(htmlSelectSelection.size(), 1, "One element should be selected");
        
        var htmlSelect = htmlSelectSelection.node();
        assert.strictEqual(htmlSelect.disabled, true, "Selector should be disabled");
        assert.strictEqual(htmlSelect.options.length, 1, "One placeholder option should be created");
        
        assertOtherClassSelectorVisibility(assert, false);
    });

    QUnit.test("Can create class selector with course in single class and with other-class selector hidden", function(assert) {
        var selector = new ClassSelector(d3.select("#qunit-fixture").node());
        
        setClassesInSelector(selector, [new AgeClass("Class 1", 11, [])]);
        
        var htmlSelectSelection = d3.select("#qunit-fixture select");
        assert.strictEqual(htmlSelectSelection.size(), 1, "One element should be selected");
        
        var htmlSelect = htmlSelectSelection.node();
        assert.strictEqual(htmlSelect.disabled, false, "Selector should be enabled");
        assert.strictEqual(htmlSelect.options.length, 1, "One placeholder option should be created");
        
        assertOtherClassSelectorVisibility(assert, false);
    });

    QUnit.test("Can create class selector with a list of three classes in the same course, making other-class selector available", function(assert) {
        var selector = new ClassSelector(d3.select("#qunit-fixture").node());
        
        setClassesInSelector(selector, [new AgeClass("Class 1", 11, []), new AgeClass("Class 2", 17, []), new AgeClass("Class 3", 22, [])]);
        
        var htmlSelectSelection = d3.select("#qunit-fixture select");
        assert.strictEqual(htmlSelectSelection.size(), 1, "One element should be selected");
        
        var htmlSelect = htmlSelectSelection.node();
        assert.strictEqual(htmlSelect.disabled, false, "Selector should not be disabled");
        assert.strictEqual(htmlSelect.options.length, 3, "Three items should be created");
        for (var i = 0; i < 3; i += 1) {
            assert.strictEqual(htmlSelect.options[i].value, i.toString());
            assert.strictEqual(htmlSelect.options[i].text, "Class " + (i + 1));
        }
        
        assertOtherClassSelectorVisibility(assert, true);
        assertOtherClassListVisibility(assert, false, 2);
    });

    QUnit.test("Setting the list of classes back to a single class sets the selector to the shorter list of class names and hides the other-class selector", function(assert) {
        var selector = new ClassSelector(d3.select("#qunit-fixture").node());

        setClassesInSelector(selector, [new AgeClass("Class 1", 11, []), new AgeClass("Class 2", 17, []), new AgeClass("Class 3", 22, [])]);
        setClassesInSelector(selector,[new AgeClass("Class 4", 20, [])]);
        
        var htmlSelectSelection = d3.select("#qunit-fixture select");
        assert.strictEqual(htmlSelectSelection.size(), 1, "One element should be selected");
        
        var htmlSelect = htmlSelectSelection.node();
        assert.strictEqual(htmlSelect.disabled, false, "Selector should not be disabled");
        assert.strictEqual(htmlSelect.options.length, 1, "One item should be created");
        assert.strictEqual(htmlSelect.options[0].value, "0");
        assert.strictEqual(htmlSelect.options[0].text, "Class 4");
        
        assertOtherClassSelectorVisibility(assert, false);
    });

    QUnit.test("Setting the selector back to an empty list of classes disables the selector again", function(assert) {
        var selector = new ClassSelector(d3.select("#qunit-fixture").node());
        
        setClassesInSelector(selector, [new AgeClass("Class 1", 11, []), new AgeClass("Class 2", 17, []), new AgeClass("Class 3", 22, [])]);
        setClassesInSelector(selector, []);
        
        var htmlSelectSelection = d3.select("#qunit-fixture select");
        assert.strictEqual(htmlSelectSelection.size(), 1, "One element should be selected");
        
        var htmlSelect = htmlSelectSelection.node();
        assert.strictEqual(htmlSelect.disabled, true, "Selector should be disabled");
        assert.strictEqual(htmlSelect.options.length, 1, "One placeholder option should be created");
        
        assertOtherClassSelectorVisibility(assert, false);
    });

    QUnit.test("Registering a handler and changing a value in the selector triggers a call to change callback", function(assert) {
        resetLastClass();
        var selector = new ClassSelector(d3.select("#qunit-fixture").node());
        selector.registerChangeHandler(handleClassChanged);
        
        setClassesInSelector(selector, [new AgeClass("Class 1", 11, []), new AgeClass("Class 2", 17, []), new AgeClass("Class 3", 22, [])]);
        var htmlSelectSelection = d3.select("#qunit-fixture select");
        assert.strictEqual(htmlSelectSelection.size(), 1, "One element should be selected");
        var htmlSelect = htmlSelectSelection.node();

        $(htmlSelect).val(2).change();
        assert.deepEqual(lastClassIdxs, [2], "Class 2 should have been changed");
        assert.strictEqual(callCount, 1, "One change should have been recorded");
    });

    QUnit.test("Registering two handlers and changing a value in the selector triggers a call to both callbacks", function(assert) {
        resetLastClass();
        
        var lastClassIdxs2 = null;
        var callCount2 = null;
        var secondHandler = function(classId) {
            lastClassIdxs2 = classId;
            callCount2 += 1;
        };
        
        var selector = new ClassSelector(d3.select("#qunit-fixture").node());
        selector.registerChangeHandler(handleClassChanged);
        selector.registerChangeHandler(secondHandler);
        
        setClassesInSelector(selector, [new AgeClass("Class 1", 11, []), new AgeClass("Class 2", 17, []), new AgeClass("Class 3", 22, [])]);
        var htmlSelectSelection = d3.select("#qunit-fixture select");
        assert.strictEqual(htmlSelectSelection.size(), 1, "One element should be selected");
        var htmlSelect = htmlSelectSelection.node();

        $(htmlSelect).val(2).change();
        assert.deepEqual(lastClassIdxs, [2], "Class 2 should have been changed");
        assert.strictEqual(callCount, 1, "One change should have been recorded");
        assert.deepEqual(lastClassIdxs2, [2], "Class 2 should have been changed");
        assert.strictEqual(callCount2, 1, "One change should have been recorded");
    });

    QUnit.test("Registering the same handler twice and changing a value in the selector triggers only one call to change callback", function(assert) {
        resetLastClass();
        var selector = new ClassSelector(d3.select("#qunit-fixture").node());
        selector.registerChangeHandler(handleClassChanged);
        selector.registerChangeHandler(handleClassChanged);
        
        setClassesInSelector(selector, [new AgeClass("Class 1", 11, []), new AgeClass("Class 2", 17, []), new AgeClass("Class 3", 22, [])]);
        var htmlSelectSelection = d3.select("#qunit-fixture select");
        assert.strictEqual(htmlSelectSelection.size(), 1, "One element should be selected");
        var htmlSelect = htmlSelectSelection.node();

        $(htmlSelect).val(2).change();
        assert.deepEqual(lastClassIdxs, [2], "Class 2 should have been changed");
        assert.strictEqual(callCount, 1, "One change should have been recorded");
    });

    QUnit.test("Can create class selector with three courses and two classes and show and hide the other-class selector", function(assert) {
        var selector = new ClassSelector(d3.select("#qunit-fixture").node());
        
        setClassesInSelectorWithTwoCourses(selector);
        
        assertOtherClassSelectorVisibility(assert, false);
        assertOtherClassListVisibility(assert, false, 0);
        
        var htmlSelect = $("#qunit-fixture select");
        
        htmlSelect.val(1).change();
        assertOtherClassSelectorVisibility(assert, true);
        assertOtherClassListVisibility(assert, false, 1);
        
        htmlSelect.val(2).change();
        assertOtherClassSelectorVisibility(assert, true);
        assertOtherClassListVisibility(assert, false, 1);
        
        htmlSelect.val(0).change();
        assertOtherClassSelectorVisibility(assert, false);
        assertOtherClassListVisibility(assert, false);
    });

    QUnit.test("Can create class selector with three courses and two classes and open and close the list of other classes by clicking on the selector", function(assert) {
        var selector = new ClassSelector(d3.select("#qunit-fixture").node());
        
        setClassesInSelectorWithTwoCourses(selector);
        
        assertOtherClassSelectorVisibility(assert, false);
        assertOtherClassListVisibility(assert, false, 0);
        
        var htmlSelect = $("#qunit-fixture select");
        
        htmlSelect.val(1).change();
        assertOtherClassSelectorVisibility(assert, true);
        assertOtherClassListVisibility(assert, false, 1);
        
        htmlSelect.click();
        assertOtherClassListVisibility(assert, true, 1);
        
        htmlSelect.click();
        assertOtherClassListVisibility(assert, false, 1);
    });

    QUnit.test("Can create class selector with three courses and two classes and open the list of other classes by clicking on the selector and close it by clicking elsewhere", function(assert) {
        var selector = new ClassSelector(d3.select("#qunit-fixture").node());
        
        setClassesInSelectorWithTwoCourses(selector);
        
        assertOtherClassSelectorVisibility(assert, false);
        assertOtherClassListVisibility(assert, false, 0);
        
        var htmlSelect = $("#qunit-fixture select");
        
        htmlSelect.val(1).change();
        assertOtherClassSelectorVisibility(assert, true);
        assertOtherClassListVisibility(assert, false, 1);
        
        htmlSelect.click();
        assertOtherClassListVisibility(assert, true, 1);
        
        $("body").click();
        assertOtherClassListVisibility(assert, false, 1);
    });

    QUnit.test("Can create class selector with three courses and two classes, open the list of other classes and select the other class", function(assert) {
        resetLastClass();
        var selector = new ClassSelector(d3.select("#qunit-fixture").node());
        
        setClassesInSelectorWithTwoCourses(selector);
        
        assertOtherClassSelectorVisibility(assert, false);
        assertOtherClassListVisibility(assert, false, 0);
        
        var htmlSelect = $("#qunit-fixture select");
        
        htmlSelect.val(1).change();
        assertOtherClassSelectorVisibility(assert, true);
        assertOtherClassListVisibility(assert, false, 1);
        
        selector.registerChangeHandler(handleClassChanged);
        
        htmlSelect.click();
        assertOtherClassListVisibility(assert, true, 1);
        
        assert.strictEqual($("div.otherClassItem.selected").length, 0, "The other class item should not be selected");
        
        $("div.otherClassItem").click();
        assert.strictEqual($("div.otherClassItem.selected").length, 1, "The other class item should be selected");
        
        assert.deepEqual(lastClassIdxs, [1, 2], "Classes 1 and 2 should have been selected");
        assert.strictEqual(callCount, 1, "One change should have been recorded");
    });

    QUnit.test("Can create class selector with three courses and two classes, open the list of other classes and select and deselect the other class", function(assert) {
        resetLastClass();
        var selector = new ClassSelector(d3.select("#qunit-fixture").node());
        
        setClassesInSelectorWithTwoCourses(selector);
        
        assertOtherClassSelectorVisibility(assert, false);
        assertOtherClassListVisibility(assert, false, 0);
        
        var htmlSelect = $("#qunit-fixture select");
        
        htmlSelect.val(1).change();
        assertOtherClassSelectorVisibility(assert, true);
        assertOtherClassListVisibility(assert, false, 1);
        
        selector.registerChangeHandler(handleClassChanged);
        
        htmlSelect.click();
        assertOtherClassListVisibility(assert, true, 1);
        
        assert.strictEqual($("div.otherClassItem.selected").length, 0, "The other class item should not be selected");
        
        $("div.otherClassItem").click();
        assert.strictEqual($("div.otherClassItem.selected").length, 1, "The other class item should be selected");
        
        $("div.otherClassItem").click();
        assert.strictEqual($("div.otherClassItem.selected").length, 0, "The other class item should not be selected");
        
        assert.deepEqual(lastClassIdxs, [1], "Class 1 only should have been selected");
        assert.strictEqual(callCount, 2, "Two changes should have been recorded");
    });

    QUnit.test("Can create class selector with three courses and two classes, select the last class, open the list of other classes and select the other class", function(assert) {
        resetLastClass();
        var selector = new ClassSelector(d3.select("#qunit-fixture").node());
        
        setClassesInSelectorWithTwoCourses(selector);
        
        assertOtherClassSelectorVisibility(assert, false);
        assertOtherClassListVisibility(assert, false, 0);
        
        var htmlSelect = $("#qunit-fixture select");
        
        htmlSelect.val(2).change();
        assertOtherClassSelectorVisibility(assert, true);
        assertOtherClassListVisibility(assert, false, 1);
        
        selector.registerChangeHandler(handleClassChanged);
        
        htmlSelect.click();
        assertOtherClassListVisibility(assert, true, 1);
        
        assert.strictEqual($("div.otherClassItem.selected").length, 0, "The other class item should not be selected");
        
        $("div.otherClassItem").click();
        assert.strictEqual($("div.otherClassItem.selected").length, 1, "The other class item should be selected");
        
        assert.deepEqual(lastClassIdxs, [2, 1], "Classes 2 and 1 should have been selected, in that order");
        assert.strictEqual(callCount, 1, "One change should have been recorded");
    });
    
})();