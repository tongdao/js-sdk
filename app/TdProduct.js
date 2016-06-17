define(function() {

	function TdProduct() {
	}

	TdProduct.prototype.setId = function(id) {
		this['!id'] = id;
	};

	TdProduct.prototype.setCurrency = function(currency) {
		this['!currency'] = currency;
	};

	TdProduct.prototype.setSku = function(sku) {
		this['!sku'] = sku;
	};

	TdProduct.prototype.setName = function(name) {
		this['!name'] = name;
	};

	TdProduct.prototype.setPrice = function(price) {
		this['!price'] = price;
	};

	TdProduct.prototype.setCategory = function(category) {
		this['!category'] = category;
	};

	return TdProduct;
});