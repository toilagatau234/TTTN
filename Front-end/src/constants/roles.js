
export const ROLES = {
  ADMIN: 'Admin',           // Quản trị viên cao nhất
  MANAGER: 'Manager',       // Quản lý (Giám sát chung)
  WAREHOUSE: 'Warehouse',   // Nhân viên kho
  STAFF: 'Staff',           // Nhân viên bán hàng & CSKH
};

// Định nghĩa Menu nào thì Role nào được thấy
export const MENU_PERMISSIONS = {
  '/admin/dashboard':     [ROLES.ADMIN, ROLES.MANAGER],
  
  // Nhóm Bán hàng & CSKH
  '/admin/orders':        [ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF],
  '/admin/customers':     [ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF],
  '/admin/reviews':       [ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF],
  '/admin/chat':          [ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF],
  
  // Nhóm Marketing
  '/admin/vouchers':      [ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF],
  '/admin/minigames':     [ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF],

  // Nhóm Kho & Sản phẩm
  '/admin/products':      [ROLES.ADMIN, ROLES.MANAGER, ROLES.WAREHOUSE],
  '/admin/categories':    [ROLES.ADMIN, ROLES.MANAGER, ROLES.WAREHOUSE],
  '/admin/inventory':     [ROLES.ADMIN, ROLES.MANAGER, ROLES.WAREHOUSE],

  // Nhóm Quản trị (Chỉ Admin)
  '/admin/staff':         [ROLES.ADMIN],
  '/admin/activity-logs': [ROLES.ADMIN, ROLES.MANAGER],
  '/admin/cms/banners':   [ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF],
  '/admin/settings':      [ROLES.ADMIN],

  //// Quyền cho nhóm CMS
  'sub-cms':              [ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF],
  '/admin/cms/banners':   [ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF],
  '/admin/cms/blogs':     [ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF],

  '/admin/staff':         [ROLES.ADMIN],

  // Nhóm Vận chuyển
  '/admin/shipping': [ROLES.ADMIN, ROLES.MANAGER, ROLES.WAREHOUSE, ROLES.SALE],
};

// Ai có tên trong list này thì MỚI ĐƯỢC thực hiện hành động
export const ACTION_PERMISSIONS = {
  CAN_DELETE: [ROLES.ADMIN], // Chỉ Admin được xóa
  CAN_EDIT_PRODUCT: [ROLES.ADMIN, ROLES.MANAGER, ROLES.WAREHOUSE],
  CAN_VIEW_REVENUE: [ROLES.ADMIN, ROLES.MANAGER]
};