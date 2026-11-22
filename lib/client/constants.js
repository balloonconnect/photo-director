export const CATS = [
  { id: 'camera', label: 'Camera bodies', one: 'camera', sug: ['Nikon Z6 II', 'Sony A7 IV', 'Canon EOS R6 II', 'Fujifilm X-T5'] },
  { id: 'lens', label: 'Lenses', one: 'lens', sug: ['85mm f/1.8', '50mm f/1.8', '35mm f/1.8', '24–70mm f/2.8', '70–200mm f/2.8'] },
  { id: 'flash', label: 'Flash units', one: 'flash', sug: ['Godox V1', 'Godox AD200', 'Godox TT600', 'Profoto A10'] },
  { id: 'continuous', label: 'Continuous lights', one: 'light', sug: ['Aputure 120d II', 'Godox SL60', 'Aputure MC'] },
  { id: 'modifier', label: 'Modifiers', one: 'modifier', sug: ['60 cm softbox', 'Octabox 90 cm', 'Beauty dish', 'Umbrella', 'Grid'] },
  { id: 'gel', label: 'Gels', one: 'gel', sug: ['CTO', 'CTB', 'Magenta', 'Teal'] },
  { id: 'reflector', label: 'Reflectors', one: 'reflector', sug: ['5-in-1 reflector 110 cm', 'Silver reflector', 'White reflector'] },
  { id: 'diffuser', label: 'Diffusers', one: 'diffuser', sug: ['Scrim 100 cm', 'Diffusion panel'] },
  { id: 'accessory', label: 'Triggers & accessories', one: 'accessory', sug: ['Godox X2T trigger', 'C-stand', 'Light stand'] },
];
export const SUBJECTS = ['Auto', 'Couple', 'Wedding', 'Portrait', 'Maternity', 'Baby', 'Family', 'Fashion', 'Product', 'Other'];
export const uid = () => Math.random().toString(36).slice(2, 9);
export const defaultGear = () => { const id = uid(); return { activeKitId: id, kits: [{ id, name: 'My kit', items: [] }] }; };
