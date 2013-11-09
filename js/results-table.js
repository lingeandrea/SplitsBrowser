(function () {
    "use strict";
    
    var NON_BREAKING_SPACE_CHAR = "\u00a0";

    /**
    * A control that shows an entire table of results.
    * @constructor
    * @param {HTMLElement} parent - The parent element to add this control to.
    */
    SplitsBrowser.Controls.ResultsTable = function (parent) {
        this.parent = parent;
        this.ageClass = null;
        this.div = null;
        this.headerSpan = null;
        this.table = null;
        this.buildTable();
    };
    
    /**
    * Build the results table.
    */
    SplitsBrowser.Controls.ResultsTable.prototype.buildTable = function () {
        this.div = d3.select(this.parent).append("div")
                                         .attr("id", "resultsTableContainer");
                                         
        this.headerSpan = this.div.append("div")
                                  .append("span")
                                  .classed("resultsTableHeader", true);
                                  
        this.table = this.div.append("table")
                             .classed("resultsTable", true);
                             
        this.table.append("thead")
                  .append("tr");
                  
        this.table.append("tbody");
    };
    
    /**
    * Populates the contents of the table with the age-class data.
    */
    SplitsBrowser.Controls.ResultsTable.prototype.populateTable = function () {
        var headerText = this.ageClass.name + ", " + this.ageClass.numControls + " control" + ((this.ageClass.numControls === 1) ? "" : "s");
        var course = this.ageClass.course;
        if (course.length !== null) {
            headerText += ", " + course.length.toFixed(1) + "km";
        }
        if (course.climb !== null) {
            headerText += ", " + course.climb + "m";
        }
        
        this.headerSpan.text(headerText);
        
        var headerCellData = ["#", "Name", "Time"].concat(d3.range(1, this.ageClass.numControls + 1)).concat(["Finish"]);
        var headerCells = this.table.select("thead tr")
                                    .selectAll("th")
                                    .data(headerCellData);
                                                       
        headerCells.enter().append("th");
        headerCells.text(function (header) { return header; });
        headerCells.exit().remove();
        
        var tableBody = this.table.select("tbody");
        tableBody.selectAll("tr").remove();
        
        function addCell(tableRow, topLine, bottomLine, cssClass) {
            var cell = tableRow.append("td");
            cell.append("span").text(topLine);
            cell.append("br");
            cell.append("span").text(bottomLine);
            if (cssClass) {
                cell.classed(cssClass, true);
            }
        }
        
        var competitors = this.ageClass.competitors.slice(0);
        competitors.sort(SplitsBrowser.Model.compareCompetitors);
        
        var nonCompCount = 0;
        var rank = 0;
        competitors.forEach(function (competitor, index) {
            var tableRow = tableBody.append("tr");
            var numberCell = tableRow.append("td");
            if (competitor.isNonCompetitive) {
                numberCell.text("n/c");
                nonCompCount += 1;
            } else if (competitor.completed()) {
                if (index === 0 || competitors[index - 1].totalTime !== competitor.totalTime) {
                    rank = index + 1 - nonCompCount;
                }
                
                numberCell.text(rank);
            }
            
            addCell(tableRow, competitor.name, competitor.club);
            addCell(tableRow, (competitor.completed()) ? SplitsBrowser.formatTime(competitor.totalTime) : "mp", NON_BREAKING_SPACE_CHAR, "time");
            
            d3.range(1, this.ageClass.numControls + 2).forEach(function (controlNum) {
                addCell(tableRow, SplitsBrowser.formatTime(competitor.getCumulativeTimeTo(controlNum)), SplitsBrowser.formatTime(competitor.getSplitTimeTo(controlNum)), "time");
            });
        }, this);
    };
    
    /**
    * Sets the class whose data is displayed.
    * @param {SplitsBrowser.Model.AgeClass} ageClass - The class displayed.
    */
    SplitsBrowser.Controls.ResultsTable.prototype.setClass = function (ageClass) {
        this.ageClass = ageClass;
        this.populateTable();
        if (this.div.style("display") !== "none") {
            this.adjustTableCellWidths();
        }
    };
    
    /**
    * Adjust the widths of the time table cells so that they have the same width.
    */
    SplitsBrowser.Controls.ResultsTable.prototype.adjustTableCellWidths = function () {
        var lastCellOnFirstRow = d3.select("tbody tr td:last-child").node();
        $("tbody td.time").width($(lastCellOnFirstRow).width());
    };
    
    /**
    * Shows the table of results.
    */
    SplitsBrowser.Controls.ResultsTable.prototype.show = function () {
        this.div.style("display", "");
        this.adjustTableCellWidths();
    };
    
    /**
    * Hides the table of results.
    */
    SplitsBrowser.Controls.ResultsTable.prototype.hide = function () {
        this.div.style("display", "none");
    };
})();