
import { MUtf8Decoder, MUtf8Encoder } from "mutf-8";
const decoder = new MUtf8Decoder();

const numToHex = (num: number) => num.toString(16).toUpperCase();

const uint8ArrToUint16 = (arr: Uint8Array, index: number) => (arr[index] << 8) + arr[index+1];
const uint8ArrToUint32 = (arr: Uint8Array, index: number) => 
    (arr[index] << 24) 
    + (arr[index+1] << 16) 
    + (arr[index+2] << 8) 
    + arr[index+3];
const uint8ArrToUint64 = (arr: Uint8Array, index: number) => 
    (arr[index] << 56) 
    + (arr[index+1] << 48) 
    + (arr[index+2] << 40) 
    + (arr[index+3] << 32) 
    + (arr[index+4] << 24) 
    + (arr[index+5] << 16) 
    + (arr[index+6] << 8) 
    + arr[index+7];

export class ClassParser{
    constructor(public readonly data: Uint8Array) {
        this.index = 0;
    }

    async process(): Promise<ClassParser> {
        try {
            this.processMagic();
            this.processVersion();
            this.processConstantPool();
            this.processAccessFlag();
            this.processThisClass();
            this.processSuperClass();
            this.processInterface();
            this.processField();
            this.processMethod();
            this.processAttribute();
        } catch(err: unknown) {
            console.log(err);
        }
        return this;
    }

    index: number;

    magic: string = '';
    processMagic() {
        this.magic = Array.from(this.data.slice(this.index, 4)).map(c => numToHex(c)).join('');
        this.index += 4;
    }
    minorVersion: number = 0;
    majorVersion: number = 0;
    processVersion() {
        this.minorVersion = uint8ArrToUint16(this.data, this.index);
        this.index += 2;
        this.majorVersion = uint8ArrToUint16(this.data, this.index);
        this.index += 2;
    }
    constantCount: number = 0;
    constants: {}[] = [];
    processConstantPool() {
        this.constantCount = uint8ArrToUint16(this.data, this.index) - 1; // position 0 is preserved
        this.index += 2;
        for (let i = 0; i < this.constantCount; ++i) {
            const constant = this.parseConstant();
            this.constants.push(constant);
            if (constant.tag === 5) {
                i++;
                this.constants.push({tag: 5});
            } else if (constant.tag === 6) {
                i++;
                this.constants.push({tag: 6});
            }
        }
    }
    parseConstant(): {tag: number, [key: string]: any} {
        // reference: https://docs.oracle.com/javase/specs/jvms/se15/html/jvms-4.html#jvms-4.4.8
        const CONST_Utf8 = 1;
        const CONST_Integer = 3;
        const CONST_Float = 4;
        const CONST_Long = 5;
        const CONST_Double = 6;
        const CONST_Class = 7;
        const CONST_String = 8;
        const CONST_FieldRef = 9;
        const CONST_MethodRef = 10;
        const CONST_InterfaceRef = 11;
        const CONST_NameAndType = 12;
        const CONST_MethodHandle = 15;
        const CONST_MethodType = 16;
        const CONST_InvokeDynamic = 18;
        const constTag = this.data[this.index];
        this.index += 1;
        switch (constTag) {
            case CONST_Utf8: // 1
                // struct utf8Info {
                //     u1 tag;
                //     u2 length;
                //     u1 bytes[length];
                // }
                const utf8Length = uint8ArrToUint16(this.data, this.index);
                this.index += 2;
                const strData = this.data.slice(this.index, this.index + utf8Length);
                this.index += utf8Length;
                return {
                    tag: CONST_Utf8,
                    type: 'Utf8',
                    length: utf8Length,
                    str: decoder.decode(strData),
                };
                break;
            case CONST_Integer: // 3
                // struct integerInfo {
                //     u1 tag;
                //     u4 bytes;
                // }
                const integer = uint8ArrToUint32(this.data, this.index);
                this.index += 4;
                return {
                    tag: CONST_Utf8,
                    type: 'Integer',
                    value: integer,
                };
                break;
            case CONST_Float: // 4
                // struct floatInfo {
                //     u1 tag;
                //     u4 bytes;
                // }
                const floatView = new DataView(new ArrayBuffer(4));
                floatView.setUint8(0, this.data[this.index]);
                floatView.setUint8(1, this.data[this.index+1]);
                floatView.setUint8(2, this.data[this.index+2]);
                floatView.setUint8(3, this.data[this.index+3]);
                this.index += 4;
                return {
                    tag: CONST_Utf8,
                    type: 'Float',
                    value: floatView.getFloat32(0),
                };
                break;
            case CONST_Long: // 5
                // struct longInfo {
                //     u1 tag;
                //     u4 high_bytes;
                //     u4 low_bytes;
                // }
                const longView = uint8ArrToUint64(this.data, this.index);
                this.index += 8;
                return {
                    tag: CONST_Long,
                    type: 'Long',
                    value: longView,
                };
                break;
            case CONST_Double: // 6
                // struct longInfo {
                //     u1 tag;
                //     u4 high_bytes;
                //     u4 low_bytes;
                // }
                const doubleView = new DataView(new ArrayBuffer(8));
                doubleView.setUint8(0, this.data[this.index]);
                doubleView.setUint8(1, this.data[this.index+1]);
                doubleView.setUint8(2, this.data[this.index+2]);
                doubleView.setUint8(3, this.data[this.index+3]);
                doubleView.setUint8(4, this.data[this.index+4]);
                doubleView.setUint8(5, this.data[this.index+5]);
                doubleView.setUint8(6, this.data[this.index+6]);
                doubleView.setUint8(7, this.data[this.index+7]);
                this.index += 8;
                return {
                    tag: CONST_Double,
                    type: 'Double',
                    value: doubleView.getFloat64(0),
                };
                break;
            case CONST_Class: // 7
                // struct classInfo {
                //     u1 tag;
                //     u2 name_index;
                // }
                const classNameIndex = uint8ArrToUint16(this.data, this.index);
                this.index += 2;
                return {
                    tag: CONST_Class,
                    type: 'Class',
                    classNameIndex: classNameIndex,
                };
                break;
            case CONST_String: // 8
                // struct stringInfo {
                //     u1 tag;
                //     u2 string_index;
                // }
                const stringIndex = uint8ArrToUint16(this.data, this.index);
                this.index += 2;
                return {
                    tag: CONST_String,
                    type: 'String',
                    stringIndex: stringIndex,
                };
                break;
            case CONST_FieldRef: // 9
                // struct fieldRef {
                //     u1 tag;
                //     u2 class_index;
                //     u2 name_and_type_index;
                // }
                const fieldRefClassIndex = uint8ArrToUint16(this.data, this.index);
                this.index += 2;
                const fieldRefNameAndTypeIndex = uint8ArrToUint16(this.data, this.index);
                this.index += 2;
                return {
                    tag: CONST_FieldRef,
                    type: 'FieldRef',
                    classIndex: fieldRefClassIndex,
                    nameAndTypeIndex: fieldRefNameAndTypeIndex,
                };
                break;
            case CONST_MethodRef: // 10
                // struct methodRef {
                //     u1 tag;
                //     u2 class_index;
                //     u2 name_and_type_index;
                // }
                const methodRefClassIndex = uint8ArrToUint16(this.data, this.index);
                this.index += 2;
                const methodRefNameAndTypeIndex = uint8ArrToUint16(this.data, this.index);
                this.index += 2;
                return {
                    tag: CONST_MethodRef,
                    type: 'MethodRef',
                    classIndex: methodRefClassIndex,
                    nameAndTypeIndex: methodRefNameAndTypeIndex,
                };
                break;
            case CONST_InterfaceRef: // 11
                // struct interfaceRef {
                //     u1 tag;
                //     u2 class_index;
                //     u2 name_and_type_index;
                // }
                const interfaceRefClassIndex = uint8ArrToUint16(this.data, this.index);
                this.index += 2;
                const interfaceRefNameAndTypeIndex = uint8ArrToUint16(this.data, this.index);
                this.index += 2;
                return {
                    tag: CONST_InterfaceRef,
                    type: 'InterfaceRef',
                    classIndex: interfaceRefClassIndex,
                    nameAndTypeIndex: interfaceRefNameAndTypeIndex,
                };
                break;
            case CONST_NameAndType: // 12
                // struct nameAndType {
                //     u1 tag;
                //     u2 name_index;
                //     u2 descriptor_index;
                // }
                const nameAndTypeNameIndex = uint8ArrToUint16(this.data, this.index);
                this.index += 2;
                const nameAndTypeDescriptorIndex = uint8ArrToUint16(this.data, this.index);
                this.index += 2;
                return {
                    tag: CONST_NameAndType,
                    type: 'NameAndType',
                    nameIndex: nameAndTypeNameIndex,
                    descriptorIndex: nameAndTypeDescriptorIndex,
                };
                break;
            case CONST_MethodHandle: // 15
                // CONSTANT_MethodHandle_info {
                //     u1 tag;
                //     u1 reference_kind;
                //     u2 reference_index;
                // }
                const methodHandleReferenceKind = this.data[this.index];
                this.index += 1;
                const methodHandleReferenceIndex = uint8ArrToUint16(this.data, this.index);
                this.index += 2;
                return {
                    tag: CONST_MethodHandle,
                    type: 'MethodHandle',
                    reference_kind: methodHandleReferenceKind,
                    reference_index: methodHandleReferenceIndex,
                };
                break;
            case CONST_MethodType: // 16
                // CONSTANT_MethodType_info {
                //     u1 tag;
                //     u2 descriptor_index;
                // }
                const methodTypeDescriptorIndex = uint8ArrToUint16(this.data, this.index);
                this.index += 2;
                return {
                    tag: CONST_MethodType,
                    type: 'MethodType',
                    descriptor_index: methodTypeDescriptorIndex,
                };
                break;
            case CONST_InvokeDynamic: // 18
                // struct InvokeDynamicInfo {
                //     u1 tag;
                //     u2 bootstrap_method_attr_index;
                //     u2 name_and_type_index;
                // }
                const invokeDynamicBootstrapMethodAttrIndex = uint8ArrToUint16(this.data, this.index);
                this.index += 2;
                const invokeDynamicNameAndTypeIndex = uint8ArrToUint16(this.data, this.index);
                this.index += 2;
                return {
                    tag: CONST_InvokeDynamic,
                    type: 'InvokeDynamic',
                    bootstrapMethodAttrIndex: invokeDynamicBootstrapMethodAttrIndex,
                    nameAndTypeIndex: invokeDynamicNameAndTypeIndex,
                };
                break;
            default:
                break;
        }
        return {tag:-1};
    }

    accessFlag: number = 0;
    get accessFlagArr() {
        const ACC_PUBLIC = 0x0001;
        const ACC_FINAL = 0x0010;
        const ACC_SUPER = 0x0020;
        const ACC_INTERFACE = 0x0200;
        const ACC_ABSTRACT = 0x0400;
        const ACC_SYNTHETIC = 0x1000;
        const ACC_ANNOTATION = 0x2000;
        const ACC_ENUM = 0x4000;
        const arr: string[] = [];
        if ((this.accessFlag & ACC_PUBLIC) > 0) arr.push('ACC_PUBLIC');
        if ((this.accessFlag & ACC_FINAL) > 0) arr.push('ACC_FINAL');
        if ((this.accessFlag & ACC_SUPER) > 0) arr.push('ACC_SUPER');
        if ((this.accessFlag & ACC_INTERFACE) > 0) arr.push('ACC_INTERFACE');
        if ((this.accessFlag & ACC_ABSTRACT) > 0) arr.push('ACC_ABSTRACT');
        if ((this.accessFlag & ACC_SYNTHETIC) > 0) arr.push('ACC_SYNTHETIC');
        if ((this.accessFlag & ACC_ANNOTATION) > 0) arr.push('ACC_ANNOTATION');
        if ((this.accessFlag & ACC_ENUM) > 0) arr.push('ACC_ENUM');
        return arr;
    }
    processAccessFlag() {
        this.accessFlag = uint8ArrToUint16(this.data, this.index);
        this.index += 2;
    }
    processThisClass() {}
    processSuperClass() {}
    processInterface() {}
    processField() {}
    processMethod() {}
    processAttribute() {}

};
