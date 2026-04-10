import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import blogService from '../../../services/blogService';
import { Spin } from 'antd';
import 'react-quill/dist/quill.snow.css';

const BlogDetail = () => {
    const { slug } = useParams();
    const [blog, setBlog] = useState(null);
    const [loading, setLoading] = useState(true);
    const [relatedBlogs, setRelatedBlogs] = useState([]);

    useEffect(() => {
        const fetchBlog = async () => {
            setLoading(true);
            try {
                const res = await blogService.getBySlug(slug);
                if (res.success) {
                    setBlog(res.data);
                    // Fetch related blogs in same category
                    const relatedRes = await blogService.getAll({ category: res.data.category, limit: 3, status: 'Published' });
                    if (relatedRes.success) {
                        setRelatedBlogs(relatedRes.data.filter(b => b._id !== res.data._id).slice(0, 3));
                    }
                }
            } catch (error) {
                console.error("Không tải được chi tiết blog:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchBlog();
    }, [slug]);

    if (loading) {
        return <div className="flex justify-center items-center min-h-[500px]"><Spin size="large" /></div>;
    }

    if (!blog) {
        return <div className="flex justify-center items-center min-h-[500px] text-gray-500">Bài viết không tồn tại hoặc đã bị xóa.</div>;
    }

    return (
        <div className="bg-neutral-50 min-h-screen py-16">
            <div className="container mx-auto px-4 lg:px-24">
                <div className="bg-white rounded-[30px] p-8 lg:p-16 shadow-sm">
                    {/* Header */}
                    <div className="mb-10 text-center max-w-3xl mx-auto">
                        <span className="bg-brand-soft text-brand-primary font-bold px-4 py-1.5 rounded-full text-sm inline-block mb-4">
                            {blog.category}
                        </span>
                        <h1 className="text-3xl lg:text-5xl font-extrabold text-navy-700 leading-tight mb-6">
                            {blog.title}
                        </h1>
                        <div className="flex items-center justify-center gap-4 text-gray-500 text-sm">
                            <span className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600">
                                    {(blog.authorName || blog.author?.name || 'A').charAt(0)}
                                </div>
                                <b>{blog.authorName || blog.author?.name || 'Hệ thống'}</b>
                            </span>
                            <span>•</span>
                            <span>{new Date(blog.createdAt).toLocaleDateString('vi-VN')}</span>
                            <span>•</span>
                            <span>{blog.views} lượt đọc</span>
                        </div>
                    </div>

                    {/* Thumbnail */}
                    <div className="w-full h-[400px] lg:h-[500px] rounded-[24px] overflow-hidden mb-12 shadow-md">
                        <img src={blog.thumbnail?.url} alt={blog.title} className="w-full h-full object-cover" />
                    </div>

                    {/* Content Component */}
                     {/* The ql-editor class helps react-quill content render its built-in styles properly */}
                    <div className="max-w-4xl mx-auto prose prose-lg prose-pink prose-headings:font-bold prose-headings:text-navy-700 ql-editor"
                         dangerouslySetInnerHTML={{ __html: blog.content }}>
                    </div>
                </div>

                {/* Related Blogs */}
                {relatedBlogs.length > 0 && (
                    <div className="mt-20">
                        <h3 className="text-2xl font-bold text-navy-700 mb-8 border-l-4 border-brand-primary pl-4">Khám phá thêm</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {relatedBlogs.map(item => (
                                <Link to={`/blog/${item.slug}`} key={item._id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-hover transition-all">
                                    <div className="h-48 overflow-hidden">
                                        <img src={item.thumbnail?.url} alt={item.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                                    </div>
                                    <div className="p-5">
                                        <span className="text-brand-primary text-xs font-bold">{item.category}</span>
                                        <h4 className="font-bold text-navy-700 mt-2 line-clamp-2">{item.title}</h4>
                                        <div className="text-gray-400 text-xs mt-3 flex justify-between">
                                            <span>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
                                            <span>{item.views} lượt đọc</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BlogDetail;
