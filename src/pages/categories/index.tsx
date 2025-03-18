// src/pages/categories/index.tsx
import React, { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Loader2, 
  Plus, 
  Edit, 
  Trash2, 
  ChevronRight 
} from 'lucide-react';
import { useCategories } from '@/hooks/use-categories';

export default function CategoriesPage() {
  const { categories, isLoading } = useCategories();
  const [expandedCategories, setExpandedCategories] = useState<number[]>([]);

  const toggleCategory = (categoryId: number) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-full">
          <Loader2 className="animate-spin w-10 h-10" />
        </div>
      </AdminLayout>
    );
  }

  const renderCategories = (cats: any[], level = 0) => {
    return cats.map((category) => (
      <React.Fragment key={category.id}>
        <TableRow>
          <TableCell className={`pl-${level * 4}`}>
            {category.children && category.children.length > 0 && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="mr-2"
                onClick={() => toggleCategory(category.id)}
              >
                <ChevronRight 
                  className={`h-4 w-4 transform transition-transform ${
                    expandedCategories.includes(category.id) ? 'rotate-90' : ''
                  }`} 
                />
              </Button>
            )}
            {category.name}
          </TableCell>
          <TableCell>{category.slug}</TableCell>
          <TableCell>
            <span className={`px-2 py-1 rounded-full text-xs ${
              category.is_active 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {category.is_active ? 'Active' : 'Inactive'}
            </span>
          </TableCell>
          <TableCell>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="icon" className="h-8 w-8">
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="destructive" size="icon" className="h-8 w-8">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
        {expandedCategories.includes(category.id) && category.children && 
          renderCategories(category.children, level + 1)}
      </React.Fragment>
    ));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Categories Management</h1>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add New Category
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Categories List</CardTitle>
              <Input 
                type="search" 
                placeholder="Search categories..." 
                className="w-64" 
              />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {renderCategories(categories)}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}