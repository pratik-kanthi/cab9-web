(function () {
    var module = angular.module('framework.UI');


    module.service('Modal', modalService);

    modalService.$inject = ['$modal'];
    function modalService($modal) {
        var _this = this;
        _this.open = open;


        function open() {
            return $modal.open({

            })
        }
    }
}())