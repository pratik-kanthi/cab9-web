(function (window, angular) {
    var module = angular.module('framework.module.documents', ["framework.services.documents"]);
    module.controller('ModuleDocumentsController', ModuleDocumentsController);

    ModuleDocumentsController.$inject = ["$scope", "rDocuments", "Model", "FileUpload", "$modal", "rConfig", "$UI", "$state"];

    function ModuleDocumentsController($scope, rDocuments, Model, FileUpload, $modal, rConfig, $UI, $state) {
        $scope.openModalWithDocument = openModalWithDocument;
        $scope.openNewDocumentModal = openNewDocumentModal;
        $scope.deleteDocument = deleteDocument;
        $scope.previewDocument = previewDocument;
        $scope.state = $state.$current.name.substring(5);
        $scope.onlyActive = rConfig.onlyActive;
        $scope.activeDocuments = rDocuments.filter(function (item) {
            return item.Active
        });
        $scope.inActiveDocuments = rDocuments.filter(function (item) {
            return !item.Active
        });
        $scope.getImagePath = function (url) {
            if (url.substring(0, 3) == 'api') {
                return window.endpoint + url;
            } else {
                return window.resourceEndpoint + url;
            }
        }

        var $active_grid = null;
        var $inactive_grid = null;
        var activePackeryDiv = document.querySelector(".active-grid");
        var inactivePackeryDiv = document.querySelector(".inactive-grid");

        function setupPackery(skip) {
            if (!skip) {
                $scope.activeDocuments = rDocuments.filter(function (item) {
                    return item.Active
                });
                $scope.inActiveDocuments = rDocuments.filter(function (item) {
                    return !item.Active
                });
            }

            setTimeout(function () {
                $active_grid = new Packery(activePackeryDiv, {
                    itemSelector: '.active-docs',
                    percentPosition: true,
                    gutter: 0
                });
                $inactive_grid = new Packery(inactivePackeryDiv, {
                    itemSelector: '.inactive-docs',
                    percentPosition: true,
                    gutter: 0
                });
            }, 1000);
        }

        setTimeout(function () {
            setupPackery(true);
        }, 1000);

        function openModalWithDocument(document) {
            var modalInstance = $modal.open({
                templateUrl: '/e9_components/layouts/module/module-document-item.modal.html',
                controller: 'ModuleDocumentItemEditController',
                resolve: {
                    rDocument: function () {
                        return document;
                    },
                    rDocumentTypes: function () {
                        if (rConfig.docTypes)
                            return rConfig.docTypes
                        return Model.DocumentType.query().execute();
                    }
                }
            })

            modalInstance.result.then(function (data) {
                swal("Document Updated!", "Document has been Updated.", "success");

                //to realign the document grid
                //setupPackery();
            }, function () {

            });
        }

        function previewDocument(doc) {
            window.open($scope.RESOURCE_ENDPOINT + doc.FilePath, '_blank');
        }

        function openNewDocumentModal() {
            var modalInstance = $modal.open({
                templateUrl: '/e9_components/layouts/module/module-document-item.modal.html',
                controller: 'ModuleDocumentItemNewController',
                resolve: {
                    rData: function () {
                        return {
                            OwnerType: rConfig.type,
                            OwnerId: rConfig.id
                        };
                    },
                    rDocumentTypes: function () {
                        if (rConfig.docTypes)
                            return rConfig.docTypes
                        return Model.DocumentType.query().execute();
                    }
                }
            });

            modalInstance.result.then(function (data) {
                swal({
                    title: "Document Added!",
                    text: "Document has been Added.",
                    type: "success"
                }, function () {});
                rDocuments.push(data);

                //to realign the document grid
                setupPackery();
            }, function () {

            });

        }

        function deleteDocument(document) {
            swal({
                title: "Are you sure?",
                text: "You will not be able to recover the document!",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: $UI.COLOURS.brandPrimary,
                confirmButtonText: "Confirm Delete!",
                closeOnConfirm: true
            }, function () {
                FileUpload.delete(document.Id).then(function () {
                    swal("Deleted!", "Document has been deleted.", "success");
                    var index = rDocuments.indexOf(document);
                    rDocuments.splice(index, 1);

                    setupPackery();
                }, function () {
                    swal("Error!", "Some Issue while deleting.", "error");
                });
            });
        }

    }
}(window, angular));