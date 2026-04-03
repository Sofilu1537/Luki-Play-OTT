import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useCmsStore } from '../../services/cmsStore';
import { adminListBlog, AdminBlogPost } from '../../services/api/adminApi';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import CmsShell, { C } from '../../components/cms/CmsShell';

export default function CmsBlog() {
  const { profile, accessToken } = useCmsStore();
  const router = useRouter();
  const [posts, setPosts] = useState<AdminBlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) router.replace('/cms/login' as never);
  }, [profile, router]);

  useEffect(() => {
    if (!accessToken) return;
    adminListBlog(accessToken).then(setPosts).finally(() => setLoading(false));
  }, [accessToken]);

  if (!profile) return null;

  return (
    <CmsShell breadcrumbs={[{ label: 'Blog' }]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <View>
            <Text style={{ color: 'white', fontSize: 22, fontWeight: '800' }}>Blog</Text>
            <Text style={{ color: C.muted, fontSize: 13, marginTop: 2 }}>{posts.length} publicaciones</Text>
          </View>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.accent, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 }}>
            <FontAwesome name="plus" size={13} color="white" />
            <Text style={{ color: 'white', fontWeight: '700', fontSize: 13 }}>Nueva Entrada</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <ActivityIndicator color={C.accent} size="large" />
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {posts.map((post) => (
              <View
                key={post.id}
                style={{
                  backgroundColor: C.surface,
                  borderRadius: 12,
                  padding: 20,
                  borderWidth: 1,
                  borderColor: C.border,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 16,
                }}
              >
                <View style={{ width: 48, height: 48, backgroundColor: `${C.accent}33`, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                  <FontAwesome name="pencil-square-o" size={20} color={C.accentLight} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: 'white', fontSize: 15, fontWeight: '700', marginBottom: 4 }}>{post.titulo}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <FontAwesome name="user-o" size={11} color={C.muted} />
                      <Text style={{ color: C.muted, fontSize: 12 }}>{post.autor}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <FontAwesome name="calendar-o" size={11} color={C.muted} />
                      <Text style={{ color: C.muted, fontSize: 12 }}>{post.publicadoEn}</Text>
                    </View>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ backgroundColor: post.activo ? '#14532D' : '#3F1515', borderRadius: 5, paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Text style={{ color: post.activo ? '#4ADE80' : '#F87171', fontSize: 11, fontWeight: '700' }}>
                      {post.activo ? 'PUBLICADO' : 'BORRADOR'}
                    </Text>
                  </View>
                  <TouchableOpacity style={{ width: 30, height: 30, borderRadius: 6, backgroundColor: '#1E3A5F', alignItems: 'center', justifyContent: 'center' }}>
                    <FontAwesome name="pencil" size={12} color="#60A5FA" />
                  </TouchableOpacity>
                  <TouchableOpacity style={{ width: 30, height: 30, borderRadius: 6, backgroundColor: '#3F1515', alignItems: 'center', justifyContent: 'center' }}>
                    <FontAwesome name="trash" size={12} color="#F87171" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </CmsShell>
  );
}
