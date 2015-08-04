(function ($) {

	var data = [
		  {
				id: 1,
				lastname: 'Rasmussen',
				firstname: 'Hunt',
				birthdate: '19/08/1985'
		  },
		  {
				id: 11,
				lastname: 'Mitchell',
				firstname: 'Karyn',
				birthdate: '11/02/1988'
		  },
		  {
				id: 21,
				lastname: 'Lucas',
				firstname: 'Patricia',
				birthdate: '03/01/2001'
		  },
		  {
				id: 31,
				lastname: 'Branch',
				firstname: 'Julie',
				birthdate: '06/07/1975'
		  },
		  {
				id: 41,
				lastname: 'Nielsen',
				firstname: 'Sandy',
				birthdate: '25/12/1980'
		  }
	];

	$(function () {
		$('#datatable').datatable({
			rowId: 'id',
			data: data,
			columns: [
				{
					name: 'Lastname',
					field: 'lastname',
					type: 'text',
					sorting: true,
					width: 280
				},
				{
					name: 'Firstname',
					field: 'firstname',
					type: 'text',
					sorting: true,
					width: 280
				}
				,
				{
					name: 'Birthdate',
					field: 'birthdate',
					type: 'text',
					width: 280
				}
			],
			paging: false,
			pageSize: 2,
			sorting: true,
			canAdd: true,
			canUpdate: true,
			canDelete: true,
			canCopy: true,
			onFieldRender: function (field, fieldName) {
				
				if(fieldName === 'birthdate'){
					field.datepicker({
						dateFormat: 'dd/mm/yy',
                        disabled: true
					});	
				}
				
				return field;
			},
			onFieldEnable: function (field, fieldName, value) {
				if(fieldName == 'birthdate'){
					field.datepicker( 'option', 'disabled', false );
				}
			},
			onFieldDisable: function (field, fieldName) {
				if(fieldName == 'birthdate'){
					field.datepicker( 'option', 'disabled', true );
				}
			},
			onFieldValueChange: function (field, fieldName, value) {
			},
			onValidateData: function (datarow) {
				return true;
			},
			onInsert: function (row, datarow, callback) {
				callback(row, datarow, true);
			},
			onUpdate: function (row, datarow, callback) {
				callback(row, datarow, true);
			},
			onDelete: function (row, datarow, callback) {
				callback(row, datarow, true);
			}
		});
	});
})(jQuery);