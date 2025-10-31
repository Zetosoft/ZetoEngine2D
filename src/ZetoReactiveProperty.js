class ZetoReactiveProperty {

	engine;
	propertyFunction;

	constructor(engine, propertyFunction) {
		this.engine = engine;
		this.propertyFunction = propertyFunction;
	}

	valueOf() {
		return this.propertyFunction(this.engine);
	}
}

export { ZetoReactiveProperty };
