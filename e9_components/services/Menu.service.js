(function (window, angular) {
    var app = angular.module("framework.services.menu", []);

    app.provider('MenuService', MenuServiceProvider);

    function MenuServiceProvider() {
        var menuItems = [];
        var defaultIcon = 'icon-Align-JustifyAll';
        var provider = {
            registerMenuItem: registerMenuItem,
            setDefaultIcon: setDefaultIcon,
            $get: getService
        };

        return provider;

        function registerMenuItem(menuItem) {
            menuItems.push(menuItem);
        }

        function setDefaultIcon(icon) {
            defaultIcon = icon;
        }

        function getService() {
            angular.forEach(menuItems, function (mi) {
                mi.$html = _buildTemplate(mi);
            });
            var service = {
                menuItems: menuItems,
                defaultIcon: defaultIcon
            };
            return service;
        }

        function _buildTemplate(menuItem) {
            var template = '<a ui-sref="' + menuItem.state + '" ui-sref-opts="{reload: true}" style="color:white;">' +
                '<i class="{{item.icon ? item.icon : menu.defaultIcon}}"></i>' +
                '{{item.title}}' +
            '</a>';
            return template;
        }

    };
})(window, angular);