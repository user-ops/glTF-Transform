import { Accessor, Document, Transform, TypedArray } from '@gltf-transform/core';
import { MeshQuantization } from '@gltf-transform/extensions';

const NAME = 'quantize';

interface QuantizeOptions {
	position?: 8 | 16;
	normal?: 8 | 16;
	texcoord?: 8 | 16;
}

const DEFAULT_OPTIONS: QuantizeOptions =  {
	position: 16,
	normal: 8,
	texcoord: 16,
};

const quantize = (options: QuantizeOptions): Transform => {

	options = {...DEFAULT_OPTIONS, ...options};

	return (doc: Document): void => {

		doc.createExtension(MeshQuantization).setRequired(true);

		const logger = doc.getLogger();
		const tmpAttribute = doc.createAccessor('_TMP');

		try {

			for (const mesh of doc.getRoot().listMeshes()) {
				for (const primitive of mesh.listPrimitives()) {
					for (const semantic of primitive.listSemantics()) {
						const attribute = primitive.getAttribute(semantic);
						if (semantic === 'POSITION') {
							const bits = options.position;
							quantizeAttribute(attribute, tmpAttribute, bits, true, bits === 8 ? Int8Array : Int16Array);
							// TODO(bug): Fix node or skinned mesh scale.
						} else if (semantic === 'NORMAL') {
							// TODO(feat): Implement.
						} else if (semantic === 'TANGENT') {
							// TODO(feat): Implement.
						} else if (semantic.startsWith('COLOR_')) {
							quantizeAttribute(attribute, tmpAttribute, 8, true, Uint8Array);
						} else if (semantic.startsWith('TEXCOORD_')) {
							const bits = options.texcoord;
							quantizeAttribute(attribute, tmpAttribute, bits, true, bits === 8 ? Uint8Array : Uint16Array);
							// TODO(bug): Fix texcoord scale.
						} else if (semantic.startsWith('JOINTS_')) {
							const bits = Math.max(...attribute.getMax([])) <= 255 ? 8 : 16;
							quantizeAttribute(attribute, tmpAttribute, bits, false, bits === 8 ? Uint8Array : Uint16Array);
						} else if (semantic.startsWith('WEIGHTS_')) {
							quantizeAttribute(attribute, tmpAttribute, 8, true, Uint8Array);
							// TODO(bug): Normalize.
						}
					}
				}
			}

		} finally {
			tmpAttribute.dispose();
		}

		// TODO(feat): Morph targets!

		logger.debug(`${NAME}: Complete.`);
	};

}

function quantizeAttribute(
		attribute: Accessor,
		tmpAttribute: Accessor,
		bits: number,
		normalized: boolean,
		ctor: new(n: number) => TypedArray): void {

	if (attribute.getComponentSize() <= bits / 8) return;

	const prevArray = attribute.getArray();
	const nextArray = new ctor(prevArray.length);
	const tmpElement = [];

	tmpAttribute
		.setType(attribute.getType())
		.setArray(nextArray)
		.setNormalized(normalized);

	for (let i = 0; i < attribute.getCount(); i++) {
		tmpAttribute.setElement(i, attribute.getElement(i, tmpElement));
	}

	attribute
		.setArray(nextArray)
		.setNormalized(normalized);
}

export { quantize };
