(function (angular) {
    var module = angular.module('cab9.utilities');

    module.controller('DocumentsController', documentsController);

    documentsController.$inject = ['$scope', '$q', '$state', 'rDocuments', 'rDocumentTypes', 'Model'];

    function documentsController($scope, $q, $state, rDocuments, rDocumentTypes, Model) {
        $scope.documents = angular.copy(rDocuments);
        $scope.searchTerm = {};
        //        $scope.filteredDocuments = $scope.documents;
        $scope.documentTypes = rDocumentTypes;
        var masonryInstance = null;
        $scope.setupGrid = setupGrid;
        $scope.filter = filter;

        $scope.filters = {
            filterBy: null,
            filterId: null
        }
        var promises = [];
        promises.push(Model.Driver.query().select("Id,Firstname,Surname").execute())
        promises.push(Model.Staff.query().select("Id,Firstname,Surname").execute())
        promises.push(Model.Client.query().select("Id,Name").execute())
        promises.push(Model.Vehicle.query().select("Id,Registration").execute())
        $q.all(promises).then(function (response) {
            $scope.Drivers = response[0];
            $scope.Staff = response[1];
            $scope.Clients = response[2];
            $scope.Vehicles = response[3];
        }, function (err) {
            swal({
                title: "Some Error Occured.",
                text: "Some error has occured.",
                type: "error",
                confirmButtonColor: $UI.COLOURS.brandSecondary
            });
        })

        function filter() {
            if ($scope.filters.filterBy && $scope.filters.filterId) {
                $scope.documents = rDocuments.filter(function (item) {
                    return item.OwnerType == $scope.filters.filterBy && item.OwnerId == $scope.filters.filterId
                });
                setupGroups();
            }
        }
        setupGroups();

        function setupGroups() {
            $scope.groups = [{
                title: "Expired Last Week",
                data: []
        }, {
                title: "Expiring in One Week",
                data: []
        }, {
                title: "Expiring in Two Weeks",
                data: []
        }, {
                title: "Expiring in One Month",
                data: []
        }, {
                title: "Not Expiring soon",
                data: []
        }, {
                title: "Expired before One Week",
                data: []
        }]
            for (i = 0, len = $scope.documents.length; i < len; i++) {
                if ($scope.documents[i].ExpiryDate) {
                    if (moment($scope.documents[i].ExpiryDate).isBefore(moment())) {
                        $scope.documents[i].$expired = true;
                        if (moment($scope.documents[i].ExpiryDate).isBefore(moment().subtract(1, 'weeks')))
                            $scope.groups[5].data.push($scope.documents[i]);
                        else
                            $scope.groups[0].data.push($scope.documents[i]);
                    } else if (moment($scope.documents[i].ExpiryDate).isBefore(moment().add(1, 'weeks')))
                        $scope.groups[1].data.push($scope.documents[i]);
                    else if (moment($scope.documents[i].ExpiryDate).isBefore(moment().add(2, 'weeks')))
                        $scope.groups[2].data.push($scope.documents[i]);
                    else if (moment($scope.documents[i].ExpiryDate).isBefore(moment().add(1, 'months')))
                        $scope.groups[3].data.push($scope.documents[i]);
                    else
                        $scope.groups[4].data.push($scope.documents[i]);
                }
            }
            setupGrid();
        }

        function setupGrid() {
            if (masonryInstance) {
                masonryInstance.masonry('destroy');
                masonryInstance = null;
            }
            setTimeout(function () {
                masonryInstance = $('.grid').masonry({
                    itemSelector: '.grid-item',
                    columnWidth: 280
                });
            }, 10);
        }
        setTimeout(function () {
            setupGrid();
        }, 500);
    }
}(angular))