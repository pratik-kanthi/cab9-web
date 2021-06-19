(function () {
    var app = angular.module('framework.directives.UI');
    app.directive('virtualisedRepeater', VirtualisedRepeaterDirective);
    VirtualisedRepeaterDirective.$inject = ['$parse', '$window'];

    function VirtualisedRepeaterDirective($parse, $window) {
        return {
            transclude: true,
            template: function (elem, attrs) {
                if (!!attrs.table) {
                    return '' +
                        '<table class="scroll-container table table-bordered table-condensed" style="position:relative;height:600px;width:100%;overflow-y:scroll;">' +
                        '<tbody class="scroll-spacing">' +

                        '</tbody>' +
                        '</table>';
                } else {
                    return '' +
                        '<div class="scroll-container" style="position:relative;height:600px;width:100%;overflow-y:scroll;">' +
                        '<div class="scroll-spacing">' +

                        '</div>' +
                        '</div>';
                }
            },
            compile: function () {
                return function (scope, elem, attrs, ctrls, transcludeFn) {
                    var tableMode = !!attrs.table;
                    var container = elem.find('.scroll-container');
                    var spacing = elem.find('.scroll-spacing');
                    var cellTemplate = '<div>{{item}}</div>';
                    //parse repeat expression
                    var repeatExpr = attrs.repeat;
                    var match = repeatExpr.match(/^\s*([\s\S]+?)\s+in\s+([\s\S]+?)(?:\s+track\s+by\s+([\s\S]+?))?\s*$/);
                    if (!match) {
                        throw new Error("collection-repeat expected expression in form of '_item_ in " +
                            "_collection_[ track by _id_]' but got '" + attrs.repeat + "'.");
                    }
                    var keyExpr = match[1];
                    var listExpr = match[2];
                    var listGetter = $parse(listExpr);

                    var itemHeight = attrs.itemHeight;
                    var itemWidth = attrs.itemWidth || 1000000;
                    var spacingWidth = 0;
                    var matchHeight = attrs.matchHeight;

                    var containerHeight = 0;
                    var containerWidth = 0;

                    var scrollBarWidth = _getScrollbarWidth();
                    var currentScroll = 0;

                    var data = [];
                    var firstRow = null;
                    var noOfRows = 0;
                    var visibleRows = [];
                    var columns = 0;
                    var rows = 0;

                    var template = null;
                    var resize = false;
                    var scrollEnd = null;
                    var resizeDebounce = null;
                    var scrollDebounce = null;
                    var applyDebounce = null;

                    var configureCell = defaultCellConfigure;
                    if (attrs.configureCell) {
                        
                    }

                    $(window).on('resize', onResize);
                    container.on('scroll', onScroll);

                    scope.$watchCollection(listGetter, function (newValue) {
                        newData = newValue || (newValue = []);
                        if (!angular.isArray(newValue)) {
                            throw new Error("collection-repeat expected an array for '" + listExpr + "', " +
                                "but got a " + typeof newValue);
                        }
                        // Wait for this digest to end before refreshing everything.
                        scope.$$postDigest(function () {
                            updateData(newData);
                        });
                    });

                    //scope.$watch(function () { }, function () {

                    //});

                    scope.$on('$destroy', function () {
                        $(window).off('resize', onResize);
                        container.off('scroll', onScroll);
                    });

                    onResize();

                    function defaultCellConfigure(cell, data) {

                    }

                    function updateData(newData) {
                        data = newData;
                        onResize();
                    }

                    function onResize() {
                        if (resizeDebounce) {
                            clearTimeout(resizeDebounce);
                        }
                        resizeDebounce = setTimeout(function () {
                            var containerOffsetTop = container.offset().top;
                            if (matchHeight) {
                                container.height($(matchHeight).height());
                            } else {
                                var windowHeight = $(window).height();
                                container.height(windowHeight - containerOffsetTop + 50);
                            }
                            resizeDebounce = null;
                            containerHeight = container.height();
                            containerWidth = container.width() - scrollBarWidth;
                            if (containerWidth < (attrs.itemWidth || 1000000)) {
                                itemWidth = containerWidth;
                            }
                            columns = Math.floor(containerWidth / itemWidth);
                            spacingWidth = (containerWidth - (itemWidth * columns)) / (columns + 1)
                            rows = Math.ceil(data.length / columns);
                            spacing.height(rows * itemHeight);
                            noOfRows = Math.min(rows, Math.ceil((containerHeight / itemHeight) + 2));
                            resize = true;
                            onScroll();
                            // _rebuildVisibleItems();
                        }, 500);
                    }

                    function _getScrollbarWidth() {
                        var outer = document.createElement("div");
                        outer.style.visibility = "hidden";
                        outer.style.width = "100px";
                        outer.style.msOverflowStyle = "scrollbar";

                        document.body.appendChild(outer);

                        var widthNoScroll = outer.offsetWidth;
                        // force scrollbars
                        outer.style.overflow = "scroll";

                        // add innerdiv
                        var inner = document.createElement("div");
                        inner.style.width = "100%";
                        outer.appendChild(inner);

                        var widthWithScroll = inner.offsetWidth;

                        // remove divs
                        outer.parentNode.removeChild(outer);

                        return widthNoScroll - widthWithScroll;
                    }

                    function onScroll() {
                        //if (scrollDebounce) {
                        //    clearTimeout(scrollDebounce);
                        //}
                        //scrollDebounce = setTimeout(function () {
                            currentScroll = container.scrollTop();
                            if (resize || visibleRows.length == 0) {
                                resize = false;
                                firstRow = Math.max(0, Math.floor((currentScroll - itemHeight) / itemHeight));
                                _rebuildVisibleItems();
                            } else {
                                var newfirstRow = Math.max(0, Math.floor((currentScroll - itemHeight) / itemHeight));
                                if (newfirstRow == firstRow) {
                                    return;
                                } else {
                                    firstRow = newfirstRow;
                                }
                                _updateVisibleItems();
                            }
                        //}, 0);
                    }

                    function _rebuildVisibleItems() {
                        angular.forEach(visibleRows, function (row) {
                            row.remove();
                        });
                        visibleRows.length = 0;
                        for (var i = 0; i < noOfRows; i++) {
                            visibleRows.push(new Row(firstRow + i));
                        }
                        scope.$apply();
                    }

                    function _updateVisibleItems() {
                        var rowNumbers = visibleRows.map(function (r) {
                            return r.rowNumber;
                        });
                        var currentMin = Math.min.apply(Math, rowNumbers);
                        var currentMax = Math.max.apply(Math, rowNumbers);
                        var newMin = firstRow;
                        var newMax = firstRow + noOfRows - 1;

                        while (newMax > rows) {
                            newMax--;
                            newMin--;
                        }
                        while (newMin < 0) {
                            newMax++;
                            newMin++;
                        }

                        if (newMax > currentMax) {
                            var shift = newMax - currentMax;
                            var moveToEnd = visibleRows.filter(function (vr) {
                                return vr.rowNumber < newMin;
                            })
                            angular.forEach(moveToEnd, function (mte) {
                                var index = visibleRows.indexOf(mte);
                                visibleRows.splice(index, 1);
                                mte.reconfigureRow(newMax--);
                                visibleRows.push(mte);
                            });
                        } else if (newMin < currentMin) {
                            var shift = currentMin - newMin;
                            var moveToStart = visibleRows.filter(function (vr) {
                                return vr.rowNumber > newMax;
                            })
                            angular.forEach(moveToStart, function (mte) {
                                var index = visibleRows.indexOf(mte);
                                visibleRows.splice(index, 1);
                                mte.reconfigureRow(newMin++);
                                visibleRows.unshift(mte);
                            });
                        }
                        console.log('Update Rows - $apply');
                        scope.$apply();
                    }

                    function _getTopForRow(index) {
                        return index * itemHeight;
                    }

                    function _getLeftForIndex(index) {
                        var column = Math.floor(index % columns);
                        return (column * itemWidth) + (column * spacingWidth) + spacingWidth;
                    }

                    function Row(rowNumber) {
                        this.rowNumber = rowNumber;
                        this.columns = [];
                        this.startIndex = rowNumber * columns;
                        this.top = _getTopForRow(rowNumber);

                        for (var i = 0; i < columns; i++) {
                            var itemIndex = this.startIndex + i;
                            var col = {};
                            col.$item = data[itemIndex];
                            if (col.$item) {
                                col.$scope = scope.$new(false);
                                col.$scope[keyExpr] = col.$item;
                                transcludeFn(col.$scope, function (cellContent) {
                                    col.$cell = cellContent;
                                });
                                col.$cell.appendTo(container);
                                col.$cell.width(itemWidth);
                                col.$cell.height(itemHeight);
                                col.$cell.css('position', 'absolute');
                                //col.$cell.css('border', '1px solid black');
                                if (col.$item) {
                                    col.$cell.css('display', 'block');
                                    col.$cell.css('top', this.top);
                                    col.$cell.css('left', _getLeftForIndex(itemIndex));
                                } else {
                                    col.$cell.css('display', 'none');
                                }
                                this.columns.push(col);
                            }
                        }

                        this.reconfigureRow = function (newRowNumber) {
                            this.rowNumber = newRowNumber;
                            this.startIndex = newRowNumber * columns;
                            this.top = _getTopForRow(newRowNumber);
                            angular.forEach(this.columns, function (col, i) {
                                var itemIndex = this.startIndex + i;
                                col.$item = data[itemIndex];
                                col.$scope[keyExpr] = col.$item;
                                //col.$scope.$apply();
                                if (col.$item) {
                                    if (col.$cell == null) {
                                        transcludeFn(col.$scope, function (cellContent) {
                                            col.$cell = cellContent;
                                        });
                                        col.$cell.appendTo(container);
                                        col.$cell.width(itemWidth);
                                        col.$cell.height(itemHeight);
                                        col.$cell.css('position', 'absolute');
                                    }
                                    col.$cell.css('display', 'block');
                                    col.$cell.css('top', this.top);
                                    col.$cell.css('left', _getLeftForIndex(itemIndex));
                                } else {
                                    angular.forEach(col.$cell, function (e) {
                                        container[0].removeChild(e);
                                    });
                                    col.$cell = null;
                                }
                            }, this);
                        }

                        this.remove = function () {
                            angular.forEach(this.columns, function (col, i) {
                                col.$scope.$destroy();
                                angular.forEach(col.$cell, function (e) {
                                    container[0].removeChild(e);
                                });
                            });
                            this.columns.length = 0;
                        }
                    }
                }
            },
        };
    };

    function range(i) {
        return i ? range(i - 1).concat(i) : []
    }
}());