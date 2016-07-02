/*
 *  SplitsBrowser ResultsTable - Shows class results in a table.
 *  
 *  Copyright (C) 2000-2014 Dave Ryder, Reinhard Balling, Andris Strazdins,
 *                          Ed Nash, Luke Woodward
 *
 *  This program is free software; you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation; either version 2 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License along
 *  with this program; if not, write to the Free Software Foundation, Inc.,
 *  51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */
(function () {
    "use strict";
    
    var formatTime = SplitsBrowser.formatTime;
    var compareCompetitors = SplitsBrowser.Model.compareCompetitors;
    var getMessage = SplitsBrowser.getMessage;
    var getMessageWithFormatting = SplitsBrowser.getMessageWithFormatting;
    var isNotNullNorNaN = SplitsBrowser.isNotNullNorNaN;
    
    var NON_BREAKING_SPACE_CHAR = "\u00a0";

    // Maximum precision to show a results-table entry using.
    var MAX_PERMITTED_PRECISION = 2;
    
    /**
    * A control that shows an entire table of results.
    * @constructor
    * @param {HTMLElement} parent - The parent element to add this control to.
    */
    function ResultsTable(parent) {
        this.parent = parent;
        this.courseClass = null;
        this.div = null;
        this.headerSpan = null;
        this.table = null;
        this.buildTable();
    }
    
    /**
    * Build the results table.
    */
    ResultsTable.prototype.buildTable = function () {
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
    * Determines the precision with which to show the results.
    * 
    * If there are some fractional times, then all times should be shown with
    * the same precision, even if not all of them need to.  For example, a
    * a split time between controls punched after 62.7 and 108.7 seconds must
    * be shown as 46.0 seconds, not 46.
    *
    * @param {Array} competitors - Array of Competitor objects.
    * @return {Number} Maximum precision to use.
    */
    function determinePrecision(competitors) {
        var maxPrecision = 0;
        var maxPrecisionFactor = 1;        
        competitors.forEach(function (competitor) {
            competitor.getAllOriginalCumulativeTimes().forEach(function (cumTime) {
                if (isNotNullNorNaN(cumTime)) {
                    while (maxPrecision < MAX_PERMITTED_PRECISION && Math.abs(cumTime - Math.round(cumTime * maxPrecisionFactor) / maxPrecisionFactor) > 1e-7 * cumTime) {
                        maxPrecision += 1;
                        maxPrecisionFactor *= 10;
                    }
                }
            });
        });
        
        return maxPrecision;
    }
    
    /**
    * Returns the contents of the time or status column for the given
    * competitor.
    * 
    * The status may be a string that indicates the competitor mispunched.
    *
    * @param {Competitor} competitor The competitor to get the status of.
    * @return {String} Time or status for the given competitor.
    */
    function getTimeOrStatus (competitor) {
        if (competitor.isNonStarter) {
            return getMessage("DidNotStartShort");
        } else if (competitor.isNonFinisher) {
            return getMessage("DidNotFinishShort");
        } else if (competitor.isDisqualified) {
            return getMessage("DisqualifiedShort");
        } else if (competitor.isOverMaxTime) {
            return getMessage("OverMaxTimeShort");
        } else if (competitor.completed()) {
            return formatTime(competitor.totalTime);
        } else {
            return getMessage("MispunchedShort");
        }
    }
    
    /**
    * Populates the contents of the table with the course-class data.
    */
    ResultsTable.prototype.populateTable = function () {
        var headerText = this.courseClass.name + ", ";
        if (this.courseClass.numControls === 1) {
            headerText += getMessage("ResultsTableHeaderSingleControl");
        } else {
            headerText += getMessageWithFormatting("ResultsTableHeaderMultipleControls", {"$$NUM$$": this.courseClass.numControls});
        }

        var course = this.courseClass.course;
        if (course.length !== null) {
            headerText += ", " + getMessageWithFormatting("ResultsTableHeaderCourseLength", {"$$DISTANCE$$": course.length.toFixed(1)});
        }
        if (course.climb !== null) {
            headerText += ", " + getMessageWithFormatting("ResultsTableHeaderClimb", {"$$CLIMB$$": course.climb});
        }
        
        this.headerSpan.text(headerText);
        
        var headerCellData = [
            getMessage("ResultsTableHeaderControlNumber"),
            getMessage("ResultsTableHeaderName"),
            getMessage("ResultsTableHeaderTime")
        ];
        
        var controls = this.courseClass.course.controls;
        if (controls === null) {
            headerCellData = headerCellData.concat(d3.range(1, this.courseClass.numControls + 1));
        } else {
            headerCellData = headerCellData.concat(controls.map(function (control, index) {
                return (index + 1) + NON_BREAKING_SPACE_CHAR + "(" + control + ")";
            }));
        }
            
        headerCellData.push(getMessage("FinishName"));
        
        var headerCells = this.table.select("thead tr")
                                    .selectAll("th")
                                    .data(headerCellData);
                                                       
        headerCells.enter().append("th");
        headerCells.exit().remove();
        headerCells = this.table.select("thead tr")
                                .selectAll("th")
                                .data(headerCellData);
                                
        headerCells.text(function (header) { return header; });
        
        var tableBody = this.table.select("tbody");
        tableBody.selectAll("tr").remove();
        
        function addCell(tableRow, topLine, bottomLine, cssClass, cumFastest, splitFastest, cumDubious, splitDubious) {
            var cell = tableRow.append("td");
            cell.append("span")
                .classed("fastest", cumFastest)
                .classed("dubious", cumDubious)
                .text(topLine);

            cell.append("br");
            cell.append("span")
                .classed("fastest", splitFastest)
                .classed("dubious", splitDubious)
                .text(bottomLine);
                
            if (cssClass) {
                cell.classed(cssClass, true);
            }
        }
        
        var competitors = this.courseClass.competitors.slice(0);
        competitors.sort(compareCompetitors);
        
        var nonCompCount = 0;
        var rank = 0;
        
        var precision = determinePrecision(competitors);
        
        competitors.forEach(function (competitor, index) {
            var tableRow = tableBody.append("tr");
            var numberCell = tableRow.append("td");
            if (competitor.isNonCompetitive) {
                numberCell.text(getMessage("NonCompetitiveShort"));
                nonCompCount += 1;
            } else if (competitor.completed()) {
                if (index === 0 || competitors[index - 1].totalTime !== competitor.totalTime) {
                    rank = index + 1 - nonCompCount;
                }
                
                numberCell.text(rank);
            }
            
            addCell(tableRow, competitor.name, competitor.club, false, false, false, false);
            addCell(tableRow, getTimeOrStatus(competitor), NON_BREAKING_SPACE_CHAR, "time", false, false, false, false);
            
            d3.range(1, this.courseClass.numControls + 2).forEach(function (controlNum) {
                var formattedCumTime = formatTime(competitor.getOriginalCumulativeTimeTo(controlNum), precision);
                var formattedSplitTime = formatTime(competitor.getOriginalSplitTimeTo(controlNum), precision);
                var isCumTimeFastest = (competitor.getCumulativeRankTo(controlNum) === 1);
                var isSplitTimeFastest = (competitor.getSplitRankTo(controlNum) === 1);
                var isCumDubious = competitor.isCumulativeTimeDubious(controlNum);
                var isSplitDubious = competitor.isSplitTimeDubious(controlNum);
                addCell(tableRow, formattedCumTime, formattedSplitTime, "time", isCumTimeFastest, isSplitTimeFastest, isCumDubious, isSplitDubious);
            });
        }, this);
    };
    
    /**
    * Sets the class whose data is displayed.
    * @param {SplitsBrowser.Model.CourseClass} courseClass - The class displayed.
    */
    ResultsTable.prototype.setClass = function (courseClass) {
        this.courseClass = courseClass;
        this.populateTable();
        if (this.div.style("display") !== "none") {
            this.adjustTableCellWidths();
        }
    };
    
    /**
    * Adjust the widths of the time table cells so that they have the same width.
    */
    ResultsTable.prototype.adjustTableCellWidths = function () {
        var lastCellOnFirstRow = d3.select("tbody tr td:last-child").node();
        $("tbody td.time").width($(lastCellOnFirstRow).width());
    };
    
    /**
    * Shows the table of results.
    */
    ResultsTable.prototype.show = function () {
        this.div.style("display", null);
        this.adjustTableCellWidths();
    };
    
    /**
    * Hides the table of results.
    */
    ResultsTable.prototype.hide = function () {
        this.div.style("display", "none");
    };
    
    /**
    * Retranslates the results table following a change of selected language.
    */
    ResultsTable.prototype.retranslate = function () {
        this.populateTable();
        if (this.div.style("display") !== "none") {
            this.adjustTableCellWidths();
        }    
    };
    
    SplitsBrowser.Controls.ResultsTable = ResultsTable;
})();