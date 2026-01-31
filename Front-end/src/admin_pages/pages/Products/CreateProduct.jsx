import React, { useState } from 'react';
import { Form, Input, InputNumber, Select, Upload, Button, message, Row, Col, Switch, Divider, Card, Breadcrumb, Modal, Table, Tag } from 'antd';
import {
    UploadOutlined, PlusOutlined, LoadingOutlined, DollarOutlined,
    BarcodeOutlined, SaveOutlined, ArrowLeftOutlined, FileImageOutlined,
    AppstoreOutlined, SearchOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Option } = Select;
const { TextArea } = Input;

const CreateProduct = () => {
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState(null);
    const [fileList, setFileList] = useState([]);

    // --- LOGIC MỚI: CHỌN NHIỀU DANH MỤC ---
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [selectedCategoryKeys, setSelectedCategoryKeys] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);

    // Dữ liệu giả Danh mục
    const categoryData = [
        { key: '1', name: 'Hoa Hồng', description: 'Các loại hoa hồng', count: 120 },
        { key: '2', name: 'Hoa Lan', description: 'Lan hồ điệp, lan rừng', count: 85 },
        { key: '3', name: 'Hoa Sinh Nhật', description: 'Mẫu hoa tặng sinh nhật', count: 200 },
        { key: '4', name: 'Hoa Khai Trương', description: 'Kệ hoa chúc mừng', count: 50 },
        { key: '5', name: 'Hoa Cưới', description: 'Hoa cầm tay cô dâu', count: 30 },
        { key: '6', name: 'Hoa Tình Yêu', description: 'Valentine, kỷ niệm', count: 150 },
    ];

    const categoryColumns = [
        { title: 'Tên danh mục', dataIndex: 'name', key: 'name' },
        { title: 'Mô tả', dataIndex: 'description', key: 'description', responsive: ['md'] },
        { title: 'Số SP', dataIndex: 'count', key: 'count', render: (c) => <Tag color="blue">{c}</Tag> },
    ];

    const handleCategoryOk = () => {
        const selectedItems = categoryData.filter(item => selectedCategoryKeys.includes(item.key));
        setSelectedCategories(selectedItems);

        form.setFieldsValue({ categories: selectedCategoryKeys });
        setIsCategoryModalOpen(false);
    };

    const rowSelection = {
        selectedRowKeys: selectedCategoryKeys,
        onChange: (selectedRowKeys) => setSelectedCategoryKeys(selectedRowKeys),
    };

    const handleAvatarChange = (info) => {
        if (info.file.status === 'uploading') {
            setLoading(true);
            return;
        }
        const reader = new FileReader();
        reader.addEventListener('load', () => setImageUrl(reader.result));
        reader.readAsDataURL(info.file.originFileObj);
        setLoading(false);
    };

    const onFinish = async (values) => {
        try {
            setLoading(true);

            const payload = {
                ...values,
                categories: selectedCategoryKeys,
            };

            console.log('Dữ liệu gửi đi:', payload);

            setTimeout(() => {
                message.success('Tạo sản phẩm mới thành công!');
                setLoading(false);
                navigate('/admin/products');
            }, 1000);

        } catch (error) {
            console.log('Failed:', error);
            setLoading(false);
        }
    };

    const uploadButton = (
        <div>
            <PlusOutlined />
            <div style={{ marginTop: 8 }}>Thêm ảnh</div>
        </div>
    );

    return (
        <div className="w-full">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex flex-col gap-1">
                    <Breadcrumb>
                        <Breadcrumb.Item onClick={() => navigate('/admin/products')} className="cursor-pointer hover:text-brand-500">
                            Sản phẩm
                        </Breadcrumb.Item>
                        <Breadcrumb.Item>Thêm mới</Breadcrumb.Item>
                    </Breadcrumb>
                    <h2 className="text-2xl font-bold text-navy-700 m-0">Tạo sản phẩm mới</h2>
                </div>

                <div className="flex gap-3">
                    <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/products')} className="rounded-xl h-[44px] px-6">Hủy bỏ</Button>
                    <Button type="primary" icon={<SaveOutlined />} onClick={() => form.submit()} loading={loading} className="rounded-xl h-[44px] px-6 bg-brand-500 font-bold border-none hover:bg-brand-600">Lưu sản phẩm</Button>
                </div>
            </div>

            <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ stock: 100, status: true }}>
                <Row gutter={24}>

                    {/* CỘT TRÁI (THÔNG TIN CHÍNH) */}
                    <Col span={24} lg={16}>
                        <Card className="rounded-[20px] shadow-sm border-none mb-6" title={<span className="font-bold text-navy-700">Thông tin chung</span>}>
                            <Form.Item name="name" label="Tên sản phẩm" rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}>
                                <Input placeholder="Ví dụ: Bó Hoa Hồng Đỏ..." className="rounded-xl h-[44px] text-base" />
                            </Form.Item>
                            <Form.Item name="description" label="Mô tả sản phẩm">
                                <TextArea rows={6} className="rounded-xl p-3 text-base" />
                            </Form.Item>
                        </Card>

                        <Card className="rounded-[20px] shadow-sm border-none mb-6" title={<span className="font-bold text-navy-700">Giá cả & Kho hàng</span>}>
                            <Row gutter={24}>
                                <Col span={12}>
                                    <Form.Item name="price" label="Giá bán (VNĐ)" rules={[{ required: true }]}>
                                        <InputNumber style={{ width: '100%' }} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} className="rounded-xl h-[44px] flex items-center pt-1 font-bold text-navy-700" placeholder="0" prefix={<DollarOutlined className="text-gray-400 mr-2" />} />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="salePrice" label="Giá khuyến mãi">
                                        <InputNumber style={{ width: '100%' }} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} className="rounded-xl h-[44px] flex items-center pt-1" placeholder="0" />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row gutter={24}>
                                <Col span={12}>
                                    <Form.Item name="sku" label="Mã SKU"><Input prefix={<BarcodeOutlined className="text-gray-400" />} className="rounded-xl h-[44px]" /></Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="stock" label="Tồn kho" rules={[{ required: true }]}><InputNumber min={0} className="w-full rounded-xl h-[44px] flex items-center pt-1" /></Form.Item>
                                </Col>
                            </Row>
                        </Card>
                    </Col>

                    {/* CỘT PHẢI (SIDEBAR) */}
                    <Col span={24} lg={8}>

                        {/* DANH MỤC (UPDATED) */}
                        <Card className="rounded-[20px] shadow-sm border-none mb-6" title={<span className="font-bold text-navy-700">Phân loại (Categories)</span>}>

                            {/* hiển thị danh mục đã chọn */}
                            <div className="mb-4">
                                {selectedCategories.length > 0 ? (
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {selectedCategories.map(cat => (
                                            <Tag key={cat.key} color="blue" closable onClose={() => {
                                                const newKeys = selectedCategoryKeys.filter(k => k !== cat.key);
                                                setSelectedCategoryKeys(newKeys);
                                                setSelectedCategories(selectedCategories.filter(c => c.key !== cat.key));
                                            }}>
                                                {cat.name}
                                            </Tag>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-gray-400 text-sm mb-3 italic">Chưa chọn danh mục nào</div>
                                )}

                                <Button
                                    type="dashed"
                                    icon={<AppstoreOutlined />}
                                    onClick={() => setIsCategoryModalOpen(true)}
                                    block
                                    className="rounded-xl h-[40px] text-brand-500 border-brand-500"
                                >
                                    Chọn danh mục
                                </Button>

                                <Form.Item name="categories" hidden><Input /></Form.Item>
                            </div>

                            <Divider className="my-4" />

                            <Form.Item name="tags" label="Thẻ Tags">
                                <Select mode="tags" placeholder="Nhập tags..." className="h-[44px] custom-select-metrix rounded-xl"><Option value="Mới">Mới</Option></Select>
                            </Form.Item>

                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                <span className="font-medium text-gray-600">Đang hoạt động</span>
                                <Form.Item name="status" valuePropName="checked" noStyle><Switch /></Form.Item>
                            </div>
                        </Card>

                        <Card className="rounded-[20px] shadow-sm border-none mb-6" title={<span className="font-bold text-navy-700">Hình ảnh</span>}>
                            <Form.Item name="avatar" noStyle>
                                <div className="text-center mb-4">
                                    <Upload
                                        name="avatar"
                                        listType="picture-card"
                                        className="avatar-uploader w-full h-[250px] overflow-hidden rounded-xl border-dashed border-2 border-gray-300 hover:border-brand-500 bg-gray-50 flex justify-center items-center"
                                        showUploadList={false}
                                        beforeUpload={() => false}
                                        onChange={handleAvatarChange}
                                    >
                                        {imageUrl ? <img src={imageUrl} alt="avatar" className="w-full h-full object-cover" /> : (
                                            <div className="flex flex-col items-center justify-center text-gray-400">
                                                {loading ? <LoadingOutlined className="text-3xl" /> : <FileImageOutlined className="text-4xl" />}
                                                <div className="font-medium mt-2">Ảnh chính</div>
                                            </div>
                                        )}
                                    </Upload>
                                </div>
                            </Form.Item>
                            <p className="font-medium text-gray-500 mb-2">Ảnh chi tiết</p>
                            <Upload listType="picture-card" fileList={fileList} onChange={({ fileList: f }) => setFileList(f)} beforeUpload={() => false} multiple>{fileList.length >= 5 ? null : uploadButton}</Upload>
                        </Card>
                    </Col>
                </Row>
            </Form>

            {/* --- MODAL CHỌN DANH MỤC --- */}
            <Modal
                title={<span className="text-lg font-bold text-navy-700">Chọn Danh Mục Sản Phẩm</span>}
                open={isCategoryModalOpen}
                onOk={handleCategoryOk}
                onCancel={() => setIsCategoryModalOpen(false)}
                width={700}
                centered
                okText="Xác nhận chọn"
                cancelText="Đóng"
                className="custom-modal-metrix"
            >
                <div className="mb-4">
                    <Input prefix={<SearchOutlined />} placeholder="Tìm kiếm danh mục..." className="rounded-xl h-[40px]" />
                </div>
                <Table
                    rowSelection={rowSelection}
                    columns={categoryColumns}
                    dataSource={categoryData}
                    pagination={{ pageSize: 5 }}
                    scroll={{ y: 300 }}
                    size="small"
                    className="custom-table-metrix border border-gray-100 rounded-xl"
                />
            </Modal>

        </div>
    );
};

export default CreateProduct;