define(function() {

	function TdOrderLine() {
	}

	TdOrderLine.prototype.setProduct = function(product) {
		this['!product'] = product;
	};

	TdOrderLine.prototype.setQuantity = function(quantity) {
		this['!quantity'] = quantity;
	};

	return TdOrderLine;
});