import { DataSource } from 'typeorm';
import { Role } from '../roles/entities/role.entity';

export async function seedRoles(dataSource: DataSource) {
  const roleRepository = dataSource.getRepository(Role);

  const defaultRoles = [
    {
      name: 'admin',
      departmentScope: null,
      permissions: ['manage_users', 'manage_roles', 'view_audit', 'manage_system'],
    },
    {
      name: 'staff',
      departmentScope: null,
      permissions: ['create_posts', 'edit_timetable', 'manage_equipment', 'view_reports'],
    },
    {
      name: 'student',
      departmentScope: null,
      permissions: ['view_resources', 'book_equipment', 'view_timetable', 'submit_fyp'],
    },
    {
      name: 'developer',
      departmentScope: null,
      permissions: ['api_register', 'api_manage_clients', 'view_logs'],
    },
    {
      name: 'class_rep',
      departmentScope: null,
      permissions: ['manage_course_announcements', 'view_class_list'],
    },
  ];

  for (const roleData of defaultRoles) {
    const existingRole = await roleRepository.findOne({ where: { name: roleData.name } });
    if (!existingRole) {
      const role = roleRepository.create(roleData);
      await roleRepository.save(role);
      console.log(`Created role: ${roleData.name}`);
    } else {
      console.log(`Role already exists: ${roleData.name}`);
    }
  }
}

