(function () {
    var module = angular.module('framework.services.csv', []);

    module.service('CSV', function () {
        return {
            fromArray: fromArray,
            download: download
        };

        function fromArray(array) {
            var rows = [];

            var fields = [];
            for (var key in array[0]) {
                if (key[0] != '$')
                    fields.push(escape(key));
            }
            rows.push(fields.map(function (f) {
                return '"' + f + '"';
            }).join(','));

            for (var i = 0; i < array.length; i++) {
                var item = array[i];
                var row = [];
                for (var j = 0; j < fields.length; j++) {
                    var field = fields[j];
                    row.push('"' + escape(item[field]) + '"');
                }
                rows.push(row.join(','));
            }

            return rows.join('\n');
        }

        function download(array, filename) {
            var data = fromArray(array);
            var a = document.createElement('a');
            a.href = 'data:attachment/csv,' + encodeURIComponent(data);
            a.target = '_blank';
            a.download = filename + '.csv';
            document.body.appendChild(a);
            a.click();
        }

        function escape(value) {
            return (angular.isDefined(value)) ? ('' + value).replace('"', '\"') : '<null>';
        }
    });
}());