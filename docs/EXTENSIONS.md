# Extensions

Extensions enhance a glTF {@link Document} with additional features and schema, beyond the core
glTF specification. For example, extensions to {@link Material} properties might include additional
textures or scalar properties affecting the Material's appearance in a specific way.

Common extensions may be imported from the `@gltf-transform/extensions` package, or custom
extensions may be created by extending the {@link Extension} base class. No extensions are included
in th default `@gltf-transform/core` package, in order to (1) minimize the code size, and (2)
ensure that any extension can be implemented externally.

Because extensions rely on the same underlying graph structure as the core specification,
references to {@link Texture}, {@link Accessor}, and other resources will be managed
automatically, even by scripts or transforms written without prior knowledge of the extension.
An extension is added to a Document by calling {@link Document.createExtension} with the
extension constructor. The extension object may then be used to construct
{@link ExtensionProperty} instances, which are attached to properties throughout the Document
as prescribed by the extension itself.

**Supported extensions:**

- [KHR_draco_mesh_compression](#khr_draco_mesh_compression)
- [KHR_lights_punctual](#khr_lights_punctual)
- [KHR_materials_clearcoat](#khr_materials_clearcoat)
- [KHR_materials_ior](#khr_materials_ior-experimental) *(experimental)*
- [KHR_materials_pbrSpecularGlossiness](#khr_materials_pbrspecularglossiness)
- [KHR_materials_specular](#khr_materials_specular-experimental) *(experimental)*
- [KHR_materials_transmission](#khr_materials_transmission-experimental) *(experimental)*
- [KHR_materials_unlit](#khr_materials_unlit)
- [KHR_mesh_quantization](#khr_mesh_quantization)
- [KHR_texture_basisu](#khr_texture_basisu-experimental) *(experimental)*

## Installation

To use extensions, first install the `@gltf-transform/extensions` package:

```shell
npm install --save @gltf-transform/extensions
```

To open files containing an {@link Extension}, the Extension constructor must be registered with
the {@link PlatformIO} instance used to read the file.

```typescript
// Register all Khronos Group (KHR_) extensions.
import { WebIO } from '@gltf-transform/core';
import { KHRONOS_EXTENSIONS } from '@gltf-transform/extensions';
const io = new WebIO().registerExtensions(KHRONOS_EXTENSIONS);

// Register an individual extension.
import { WebIO } from '@gltf-transform/core';
import { MaterialsUnlit } from '@gltf-transform/extensions';
const io = new WebIO().registerExtensions([MaterialsUnlit]);

// Read a file that requires the KHR_materials_unlit extension.
const doc = await io.readGLB('unlit.glb');
```

Reading files requires registering the necessary Extensions, but writing files does not — the
Extension objects are already attached to the Document itself. Some extensions may require
installing dependencies:

```typescript
import { NodeIO } from '@gltf-transform/core';
import { KHRONOS_EXTENSIONS } from '@gltf-transform/extensions';

import * as draco3d from 'draco3dgltf';

const io = new NodeIO()
  .registerExtensions(KHRONOS_EXTENSIONS)
  .registerDependencies({
    'draco3d.decoder': draco3d.createDecoderModule(), // Optional.
    'draco3d.encoder': draco3d.createEncoderModule(), // Optional.
  });

const doc = io.read('compressed.glb');
```

## API

When generating a glTF {@link Document}, import the {@link Extension} constructor and pass it to
the {@link Document.createExtension} factory method.

```typescript
import { Document } from '@gltf-transform/core';
import { MaterialsUnlit, Unlit } from '@gltf-transform/extensions';

// Create Document, and an instance of the KHR_materials_unlit extension.
const doc = new Document();
const unlitExtension = doc.createExtension(MaterialsUnlit).setRequired(false);

// Create a Material, and attach an Unlit property to it.
const unlit = unlitExtension.createUnlit();
doc.createMaterial('MyUnlitMaterial').setExtension('KHR_materials_unlit', unlit);
```

The {@link Extension} instance is then used to construct {@link ExtensionProperty} instances
related to that Extension. Some Extensions, like `KHR_mesh_quantization`, have no Properties and
simply have a holistic effect on the entire Document. Only one ExtensionProperty from a given
Extension can be attached to any given Property at a time. Properties may have ExtensionProperties
from multiple Extensions attached.

For further details on the general Extension API, see {@link Extension} and
{@link ExtensionProperty}.

### Custom extensions

In addition to the official Khronos and multi-vendor extensions, the glTF format can be extended
with [custom extensions](https://github.com/KhronosGroup/glTF/blob/master/extensions/README.md)
for specific applications. glTF-Transform supports reading/writing custom extensions, without
modifications to the core codebase. Any extension implemented correctly and registered with the I/O
instance may be read from a file, modified programmatically, and written back to a file.

For implementation examples, see [packages/extensions](https://github.com/donmccurdy/glTF-Transform/tree/master/packages/extensions).

## Supported extensions

### KHR_draco_mesh_compression

- *Specification: [KHR_draco_mesh_compression](https://github.com/KhronosGroup/glTF/blob/master/extensions/2.0/Khronos/KHR_draco_mesh_compression/)*
- *Source: [packages/extensions/src/khr-draco-mesh-compression/](https://github.com/donmccurdy/glTF-Transform/tree/master/packages/extensions/src/khr-draco-mesh-compression)*

The `KHR_draco_mesh_compression` extension provides advanced compression for mesh geometry. For
models where geometry is a significant factor (>1 MB), Draco can reduce filesize by ~95% in many
cases. When animation or textures are large, other complementary compression methods should be used
as well. For geometry <1MB, the size of the WASM decoder library may outweigh size savings.

Be aware that decompression happens before uploading to the GPU — this will add some latency to the
parsing process, and means that compressing geometry with  Draco does _not_ affect runtime
performance. To improve framerate, you'll need to simplify the geometry by reducing vertex count or
draw calls — not just compress it. Finally, be aware that Draco compression is lossy: repeatedly
compressing and decompressing a model in a pipeline will lose precision, so compression should
generally be the last stage of an art workflow, and uncompressed original files should be kept.

Currently, only _reading_ `KHR_draco_mesh_compression` is supported, and output will always be
uncompressed. Writing compressed data will be added at a later date, so for now use glTF-Pipeline
for that. A decoder or encoder from `draco3dgltf` npm module is required for reading and writing
respectively, and must be provided by the application:

```typescript
import { NodeIO } from '@gltf-transform/core';
import { DracoMeshCompression } from '@gltf-transform/extensions';

import * as draco3d from 'draco3dgltf';

const io = new NodeIO()
  .registerExtensions([DracoMeshCompression])
  .registerDependencies({
    'draco3d.decoder': draco3d.createDecoderModule(),
    'draco3d.encoder': draco3d.createEncoderModule(),
  });

const doc = io.read('compressed.glb');
```

### KHR_lights_punctual

- *Specification: [KHR_lights_punctual](https://github.com/KhronosGroup/glTF/blob/master/extensions/2.0/Khronos/KHR_lights_punctual/)*
- *Source: [packages/extensions/src/khr-lights-punctual/](https://github.com/donmccurdy/glTF-Transform/tree/master/packages/extensions/src/khr-lights-punctual)*

The `KHR_lights_punctual` extension defines three "punctual" light types: directional, point and
spot. Punctual lights are defined as parameterized, infinitely small points that emit light in
well-defined directions and intensities. Lights are referenced by nodes and inherit the transform
of that node.

```typescript
import { LightsPunctual, Light, LightType } from '@gltf-transform/extensions';

// Create an Extension attached to the Document.
const lightsExtension = document.createExtension(LightsPunctual);

// Create a Light property.
const light = lightsExtension.createLight()
  .setType(LightType.POINT)
  .setIntensity(2.0)
  .setColor([1.0, 0.0, 0.0]);

// Attach the property to a material.
node.setExtension('KHR_lights_punctual', light);
```

### KHR_materials_clearcoat

- *Specification: [KHR_materials_clearcoat](https://github.com/KhronosGroup/glTF/blob/master/extensions/2.0/Khronos/KHR_materials_clearcoat/)*
- *Source: [packages/extensions/src/khr-materials-clearcoat/](https://github.com/donmccurdy/glTF-Transform/tree/master/packages/extensions/src/khr-materials-clearcoat)*

The `KHR_materials_clearcoat` extension defines a clear coating that can be layered on top of an
existing glTF material definition. A clear coat is a common technique used in Physically-Based
Rendering to represent a protective layer applied to a base material.

The `MaterialsClearcoat` class provides a single {@link ExtensionProperty} type, `Clearcoat`, which
may be attached to any {@link Material} instance. For example:

```typescript
import { MaterialsClearcoat, Clearcoat } from '@gltf-transform/extensions';

// Create an Extension attached to the Document.
const clearcoatExtension = document.createExtension(MaterialsClearcoat);

// Create a Clearcoat property.
const clearcoat = clearcoatExtension.createClearcoat()
  .setClearcoatFactor(1.0);

// Attach the property to a material.
material.setExtension('KHR_materials_clearcoat', clearcoat);
```

### KHR_materials_ior <mark>*(experimental)*</mark>

- *Draft specification: [KHR_materials_ior](https://github.com/KhronosGroup/glTF/pull/1718)*
- *Source: [packages/extensions/src/khr-materials-ior/](https://github.com/donmccurdy/glTF-Transform/tree/master/packages/extensions/src/khr-materials-ior)*

The dielectric BRDF of the metallic-roughness material in glTF uses a fixed value of 1.5 for the
index of refraction. This is a good fit for many plastics and glass, but not for other materials
like water or asphalt, sapphire or diamond. `KHR_materials_ior` allows users to set the index of
refraction to a certain value.

The `MaterialsIOR` class provides a single {@link ExtensionProperty} type, `IOR`, which
may be attached to any {@link Material} instance. For example:

```typescript
import { MaterialsIOR, IOR } from '@gltf-transform/extensions';

// Create an Extension attached to the Document.
const iorExtension = document.createExtension(MaterialsIOR);

// Create a IOR property.
const ior = iorExtension.createIOR().setIOR(1.0);

// Attach the property to a material.
material.setExtension('KHR_materials_ior', ior);
```

### KHR_materials_pbrSpecularGlossiness

- *Specification: [KHR_materials_pbrSpecularGlossiness](https://github.com/KhronosGroup/glTF/blob/master/extensions/2.0/Khronos/KHR_materials_pbrSpecularGlossiness/)*
- *Source: [packages/extensions/src/khr-materials-pbr-specular-glossiness/](https://github.com/donmccurdy/glTF-Transform/tree/master/packages/extensions/src/khr-materials-pbr-specular-glossiness)*

`KHR_materials_pbrSpecularGlossiness` converts a PBR material from the default metal/rough workflow
to a spec/gloss workflow. The spec/gloss workflow does _not_ support other PBR extensions such as
clearcoat, transmission, IOR, etc. For the complete PBR feature set and specular data, use the
`KHR_materials_specular` extension instead of this one, which provides specular data within a
metal/rough workflow.

The `MaterialsPBRSpecularGlossiness` class provides a single {@link ExtensionProperty} type, `PBRSpecularGlossiness`, which
may be attached to any {@link Material} instance. For example:

```typescript
import { MaterialsPBRSpecularGlossiness, PBRSpecularGlossiness } from '@gltf-transform/extensions';

// Create an Extension attached to the Document.
const specGlossExtension = document.createExtension(MaterialsPBRSpecularGlossiness);

// Create a PBRSpecularGlossiness property.
const specGloss = specGlossExtension.createPBRSpecularGlossiness()
  .setSpecularFactor(1.0);

// Attach the property to a material.
material.setExtension('KHR_materials_pbrSpecularGlossiness', specGloss);
```

### KHR_materials_specular <mark>*(experimental)*</mark>

- *Draft specification: [KHR_materials_specular](https://github.com/KhronosGroup/glTF/pull/1719)*
- *Source: [packages/extensions/src/khr-materials-specular/](https://github.com/donmccurdy/glTF-Transform/tree/master/packages/extensions/src/khr-materials-specular)*

`KHR_materials_specular` allows users to configure the strength of the specular reflection in the
dielectric BRDF. A value of zero disables the specular reflection, resulting in a pure diffuse
material.

The `MaterialsSpecular` class provides a single {@link ExtensionProperty} type, `Specular`, which
may be attached to any {@link Material} instance. For example:

```typescript
import { MaterialsSpecular, Specular } from '@gltf-transform/extensions';

// Create an Extension attached to the Document.
const specularExtension = document.createExtension(MaterialsSpecular);

// Create a Specular property.
const specular = specularExtension.createSpecular()
  .setSpecularFactor(1.0);

// Attach the property to a material.
material.setExtension('KHR_materials_specular', specular);
```

### KHR_materials_transmission <mark>*(experimental)*</mark>

- *Specification: [KHR_materials_transmission](https://github.com/KhronosGroup/glTF/blob/master/extensions/2.0/Khronos/KHR_materials_transmission/)*
- *Source: [packages/extensions/src/khr-materials-transmission/](https://github.com/donmccurdy/glTF-Transform/tree/master/packages/extensions/src/khr-materials-transmission)*

The `KHR_materials_transmission` This extension aims to address the simplest and most common use
cases for optical transparency: infinitely-thin materials with no refraction, scattering, or
dispersion. When combined with `KHR_materials_volume`, transmission may be used for thicker
materials and refractive effects.

The `MaterialsTransmission` class provides a single {@link ExtensionProperty} type, `Transmission`, which
may be attached to any {@link Material} instance. For example:

```typescript
import { MaterialsTransmission, Transmission } from '@gltf-transform/extensions';

// Create an Extension attached to the Document.
const transmissionExtension = document.createExtension(MaterialsTransmission);

// Create a Transmission property.
const transmission = transmissionExtension.createTransmission()
  .setTransmissionFactor(1.0);

// Attach the property to a material.
material.setExtension('KHR_materials_transmission', transmission);
```

### KHR_materials_unlit

- *Specification: [KHR_materials_unlit](https://github.com/KhronosGroup/glTF/blob/master/extensions/2.0/Khronos/KHR_materials_unlit/)*
- *Source: [packages/extensions/src/khr-materials-unlit/](https://github.com/donmccurdy/glTF-Transform/tree/master/packages/extensions/src/khr-materials-unlit)*

The `KHR_materials_unlit` extension defines an unlit shading model for use in glTF 2.0 materials,
as an alternative to the Physically Based Rendering (PBR) shading models provided by the core
specification.

The `MaterialsUnlit` class provides a single {@link ExtensionProperty} type, `Unlit`, which may be
attached to any {@link Material} instance. For example:

```typescript
import { MaterialsUnlit, Unlit } from '@gltf-transform/extensions';

// Create an Extension attached to the Document.
const unlitExtension = document.createExtension(MaterialsUnlit);

// Create an Unlit property.
const unlit = unlitExtension.createUnlit();

// Attach the property to a material.
material.setExtension('KHR_materials_unlit', unlit);
```

### KHR_mesh_quantization

- *Specification: [KHR_mesh_quantization](https://github.com/KhronosGroup/glTF/blob/master/extensions/2.0/Khronos/KHR_mesh_quantization/)*
- *Source: [packages/extensions/src/khr-mesh-quantization/](https://github.com/donmccurdy/glTF-Transform/tree/master/packages/extensions/src/khr-mesh-quantization)*

The `KHR_mesh_quantization` extension expands the set of allowed component types for mesh attribute
storage to provide a memory/precision tradeoff — depending on the application needs, 16-bit or
8-bit storage can be sufficient.

Defining no {@link ExtensionProperty} types, this {@link Extension} is simply attached to the
{@link Document}, and affects the entire Document by allowing more flexible use of {@link Accessor}
types for vertex attributes. Without the Extension, the same use of these data types would yield
an invalid glTF document, under the stricter core glTF specification.

```typescript
import { MeshQuantization } from '@gltf-transform/extensions';

// Create an Extension attached to the Document.
const quantizationExtension = document.createExtension(MeshQuantization).setRequired(true);
```

### KHR_texture_basisu <mark>*(experimental)*</mark>

- *Draft specification: [KHR_texture_basisu](https://github.com/KhronosGroup/glTF/pull/1751)*
- *Source: [packages/extensions/src/khr-texture-basisu/](https://github.com/donmccurdy/glTF-Transform/tree/master/packages/extensions/src/khr-texture-basisu)*

The `KHR_texture_basisu` extension adds the ability to use KTX2 GPU textures with Basis Universal
supercompression for any material texture. GPU texture formats, unlike traditional image formats,
remain compressed in GPU memory. As a result, they (1) upload to the GPU much more quickly, and (2)
require much less GPU memory. In certain cases they may also have smaller filesizes than PNG or
JPEG textures, but this is not guaranteed. GPU textures often require more careful tuning during
compression to maintain image quality, but this extra effort is worthwhile for applications that
need to maintain a smooth framerate while uploading images, or where GPU memory is limited.

Defining no {@link ExtensionProperty} types, this {@link Extension} is simply attached to the
{@link Document}, and affects the entire Document by allowing use of the `image/ktx2` MIME type
and passing KTX2 image data to the {@link Texture.setImage} method. Without the Extension, the
same MIME types and image data would yield an invalid glTF document, under the stricter core glTF
specification.

```typescript
import { TextureBasisu } from '@gltf-transform/extensions';

// Create an Extension attached to the Document.
const basisuExtension = document.createExtension(TextureBasisu)
  .setRequired(true);
document.createTexture('MyCompressedTexture')
  .setMimeType('image/ktx2')
  .setImage(fs.readFileSync('my-texture.ktx2'));
```

Compression is not done automatically when adding the extension as shown above — you must compress
the image data first, then pass the `.ktx2` payload to {@link Texture.setImage}. The [glTF-Transform
CLI](/cli.html) has functions to help with this, or any similar KTX2-capable utility will work.

When the `KHR_texture_basisu` extension is added to a file by glTF-Transform, the extension should
always be required. This tool does not support writing assets that "fall back" to optional PNG or
JPEG image data.

> **NOTICE:** The `KHR_texture_basisu` extension is still a draft specification, and may change
before being officially ratified. Some aspects are still being worked out — in particular, naively
compressing a 3-component (RGB) normal map will often give poor results with the ETC1S compression
option.
