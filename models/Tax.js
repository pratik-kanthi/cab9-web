(function(angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('Tax', 'api/taxes', {
            Id: {
                type: String,
                editable: false,
                hidden: true
            },
            TenantId: {
                type: String,
                editable: false,
                hidden: true
            },
            Name: {
                type: String,
                required: true
            },
            TaxTypeId: {
                type: String,
                display: 'Tax Type',
                displayField: 'TaxType.Name',
                table: {
                    hidden: true
                }
            },
            TaxType: {
                type: 'TaxType',
                ref: 'TaxType',
                refBy: 'TaxTypeId',
                table: {
                    hidden: true
                }
            },
            _TaxType: {
                type: String,
                calculated: function() {
                    return (this.TaxType) ? this.TaxType.Name : '';
                },
                display: 'Tax Type'
            },
            Description: {
                type: String,
                table: {
                    visible: false
                }
            },
            TaxComponents: {
                type: ['TaxComponent'],
                ref: 'TaxComponent',
                refType: 'OneToMany',
                defaultValue: [],
                table: {
                    hidden: true
                }
            },
            _TaxRate: {
                type: String,
                display: 'Rate',
                calculated: function() {
                    var result = 0;
                    if (this.TaxComponents) {
                        for (var i = 0; i < this.TaxComponents.length; i++) {
                            result = result + this.TaxComponents[i].Rate;
                        }
                    }
                    return result + '%';
                }
            },
            _TaxAmount: {
                type: Number,
                table: {
                    hidden: true
                },
                calculated: function() {
                    var result = 0;
                    if (this.TaxComponents) {
                        for (var i = 0; i < this.TaxComponents.length; i++) {
                            result = result + (this.TaxComponents[i].Rate / 100);
                        }
                    }
                    return result;
                }
            },
            CreationTime: {
                type: moment,
                display: 'Creation Time',
                table: {
                    hidden: true
                }
            },
            ModificationUserId: {
                type: String,
                table: {
                    hidden: true
                }
            },
            CreationUserId: {
                type: String,
                table: {
                    hidden: true
                }
            },
            ModificationTime: {
                type: moment,
                display: 'Modification Time',
                table: {
                    hidden: true
                }
            }
        });
    }
})(angular);