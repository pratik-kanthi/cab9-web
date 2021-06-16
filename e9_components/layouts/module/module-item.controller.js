(function(angular) {
    var module = angular.module('framework.UI.module');

    module.controller('ModuleItemViewController', moduleItemViewController);

    moduleItemViewController.$inject = ['$scope', 'rTabs', 'rData', 'rAccessors', '$compile'];

    function moduleItemViewController($scope, rTabs, rData, rAccessors, $compile) {
        $scope.item = rData[0];
        $scope.accessors = rAccessors;
        $scope.tabDefs = [];
        if (rTabs.length > 4) {
            for (var i = 0; i < 3; i++) {
                $scope.tabDefs.push(rTabs[i]);
            }
            setTimeout(function() {
                $(".module-item .module-item-nav-bar .tab-container ul.nav-tabs").append('<li class="has-dropdown"><a><span id="selected">More</span><i class="material-icons">arrow_drop_down</i></a><ul class="subnav"></ul></li>');
                for (var i = 3; i < rTabs.length; i++) {
                    var key = Object.keys(rTabs[i].params)[0];
                    $(".subnav").append($compile('<li><a ui-sref="' + rTabs[i].route + '({' + key + ':\'' + rTabs[i].params[key] + '\'})">' + rTabs[i].heading + '</a></li>')($scope));
                }
                $('.subnav a').click(function() {
                    $('#selected').text($(this).text());
                });
            }, 0);
        } else
            $scope.tabDefs = rTabs;



    }
})(angular);