(function (angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('DriverPaymentAdjustment', 'api/DriverPaymentAdjustments', {
            Id: {
                type: String,
                editable: false,
                required: true,
                table: {
                    visible: false
                }
            },
            TenantId: {
                type: String,
                editable: false,
                hidden: true
            },
            DriverPaymentId: {
                type: String,
                required: true,
                table: {
                    hidden: true
                }
            },
            DriverPayment: {
                type: 'DriverPayment',
                table: {
                    hidden: true
                }
            },
            DriverAdjustmentId: {
                type: String,
                table: {
                    hidden: true
                }
            },
            BookingId: {
                type: String,
                editable: false,
                hidden: true
            },
            DriverAdjustment: {
                type: 'DriverAdjustment',
                table: {
                    hidden: true
                }
            },
            TaxId: {
                    type: String,
                    table: {
                        hidden: true
                    }
                },
            Tax: {
                type: 'Tax',
                        table: {
                    hidden: true
                    }
            },
            DriverPaymentModelAdjustmentId: {
                type: String,
                table: {
                    hidden: true
                }
            },
            DriverPaymentModelAdjustment: {
                type: 'DriverPaymentModelAdjustment',
                table: {
                    hidden: true
                }
            },
            Amount: {
                type: Number,
                binding: function(row) {
                    return "£" + row.Amount.toFixed(2);
                }
            },
            TaxAmount: {
                type: Number,
                table: {
                }
            },
            Type: {
                type: String,
                table: {
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